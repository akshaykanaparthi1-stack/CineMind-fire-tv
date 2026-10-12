from typing import List, Dict, Any, Optional, Tuple
from ..schemas.movies import MovieSchema, AIMatchInsights, ToneScores, FamilySafetyNotes
from ..schemas.sessions import (
    SessionParticipantCreate, 
    GroupRecommendationResult, 
    ParticipantScoreBreakdown
)
from ..schemas.common import AgeRatingEnum, VoteTypeEnum, MoodEnum, GenreEnum

AGE_RATING_SEVERITY: Dict[str, int] = {
    "G": 1,
    "PG": 2,
    "PG-13": 3,
    "TV-14": 3,
    "R": 4,
    "TV-MA": 4,
    "Unrated": 3,
    "NR": 3,
}

VOTE_WEIGHTS: Dict[str, float] = {
    "love": 1.0,
    "like": 0.75,
    "neutral": 0.5,
    "dislike": 0.2,
    "veto": 0.0,
}

def filter_movies_by_restrictions(
    movies: List[MovieSchema],
    participants: List[SessionParticipantCreate]
) -> Tuple[List[MovieSchema], List[Dict[str, Any]]]:
    """
    Mandatory Content & Age Restriction Pre-Filter.
    Eliminates any movie that violates ANY participant's required age ceiling or content restrictions.
    """
    surviving: List[MovieSchema] = []
    rejections: List[Dict[str, Any]] = []

    for movie in movies:
        movie_severity = AGE_RATING_SEVERITY.get(movie.ageRating.value if hasattr(movie.ageRating, 'value') else movie.ageRating, 3)
        rejected = False

        for p in participants:
            max_rating = p.max_age_rating.value if hasattr(p.max_age_rating, 'value') else p.max_age_rating
            allowed_severity = AGE_RATING_SEVERITY.get(max_rating, 4)

            # 1. Mandatory Age Rating Check
            if movie_severity > allowed_severity:
                rejections.append({
                    "movieId": movie.id,
                    "movieTitle": movie.title,
                    "violatingParticipant": p.name,
                    "reason": f"Exceeds {p.name}'s maximum allowed rating ({max_rating}) with {movie.ageRating}"
                })
                rejected = True
                break

            # 2. Mandatory Content Restrictions
            v_text = (movie.familySafety.violence if movie.familySafety else "").lower()
            lang_text = (movie.familySafety.language if movie.familySafety else "").lower()
            theme_text = (movie.familySafety.themes if movie.familySafety else "").lower()

            if p.avoid_violence:
                if movie_severity >= 4 or "gore" in v_text or "combat" in v_text or "war" in v_text:
                    rejections.append({
                        "movieId": movie.id,
                        "movieTitle": movie.title,
                        "violatingParticipant": p.name,
                        "reason": f"Violates {p.name}'s restriction: Avoid Violence"
                    })
                    rejected = True
                    break

            if p.avoid_strong_language:
                if movie_severity >= 4 or "coarse" in lang_text or "strong" in lang_text or "profanity" in lang_text:
                    rejections.append({
                        "movieId": movie.id,
                        "movieTitle": movie.title,
                        "violatingParticipant": p.name,
                        "reason": f"Violates {p.name}'s restriction: Avoid Strong Language"
                    })
                    rejected = True
                    break

            if p.avoid_sensitive_themes:
                if "extinction" in theme_text or "death" in theme_text or "fanaticism" in theme_text:
                    rejections.append({
                        "movieId": movie.id,
                        "movieTitle": movie.title,
                        "violatingParticipant": p.name,
                        "reason": f"Violates {p.name}'s restriction: Avoid Sensitive Themes"
                    })
                    rejected = True
                    break

        if not rejected:
            surviving.append(movie)

    return surviving, rejections

def calculate_participant_score(
    participant: SessionParticipantCreate,
    movie: MovieSchema,
    vote_cast: Optional[VoteTypeEnum]
) -> ParticipantScoreBreakdown:
    """Score a single participant against a candidate movie."""
    # 1. Vote weight
    v_val = vote_cast.value if vote_cast and hasattr(vote_cast, 'value') else (vote_cast or "neutral")
    vote_weight = VOTE_WEIGHTS.get(v_val, 0.5)

    # 2. Genre Overlap
    p_genres = [g.value if hasattr(g, 'value') else g for g in participant.preferred_genres]
    m_genres = [g.value if hasattr(g, 'value') else g for g in movie.genres]
    genre_overlap = [g for g in m_genres if g in p_genres]

    if len(p_genres) == 0:
        genre_weight = 0.6
    elif len(genre_overlap) >= 2:
        genre_weight = 1.0
    elif len(genre_overlap) == 1:
        genre_weight = 0.8
    else:
        genre_weight = 0.25

    # 3. Mood Overlap
    p_moods = [m.value if hasattr(m, 'value') else m for m in participant.preferred_moods]
    m_moods = [m.value if hasattr(m, 'value') else m for m in movie.moods]
    mood_overlap = [m for m in m_moods if m in p_moods]

    if len(p_moods) == 0:
        mood_weight = 0.6
    elif len(mood_overlap) >= 2:
        genre_weight = 1.0
        mood_weight = 1.0
    elif len(mood_overlap) == 1:
        mood_weight = 0.8
    else:
        mood_weight = 0.3

    # 4. Runtime Compliance
    runtime_compliant = movie.runtimeMinutes <= participant.max_runtime_minutes
    runtime_weight = 1.0 if runtime_compliant else max(0.2, 1.0 - ((movie.runtimeMinutes - participant.max_runtime_minutes) / 60.0))

    # Composite normalized satisfaction formula
    raw = (vote_weight * 0.40) + (genre_weight * 0.25) + (mood_weight * 0.20) + (runtime_weight * 0.15)
    score = int(round(raw * 100))
    clamped_score = max(0, min(100, score))

    return ParticipantScoreBreakdown(
        participant_id=participant.participant_id,
        participant_name=participant.name,
        avatar=participant.avatar,
        satisfaction_score=clamped_score,
        vote_cast=vote_cast,
        genre_overlap=genre_overlap,
        mood_overlap=mood_overlap,
        runtime_compliant=runtime_compliant
    )

def rank_movies_for_family_group(
    candidate_movies: List[MovieSchema],
    participants: List[SessionParticipantCreate],
    votes: Dict[str, Dict[str, VoteTypeEnum]]
) -> List[GroupRecommendationResult]:
    """
    Rank candidate movies using transparent multi-tier algorithm and deterministic tie-breaking.
    """
    surviving_movies, _ = filter_movies_by_restrictions(candidate_movies, participants)

    scored_entries: List[Dict[str, Any]] = []

    for movie in surviving_movies:
        movie_votes = votes.get(movie.id, {})
        breakdowns: List[ParticipantScoreBreakdown] = []

        veto_count = 0
        love_count = 0

        for p in participants:
            v_cast = movie_votes.get(p.participant_id)
            if v_cast == VoteTypeEnum.VETO or v_cast == "veto":
                veto_count += 1
            if v_cast == VoteTypeEnum.LOVE or v_cast == "love":
                love_count += 1

            bd = calculate_participant_score(p, movie, v_cast)
            breakdowns.append(bd)

        # Average group compatibility
        avg_score = sum(b.satisfaction_score for b in breakdowns) / max(1, len(breakdowns))

        # Penalty for vetoes: -25 points per veto
        penalized_score = max(0, int(round(avg_score - (veto_count * 25))))

        # Extract Shared Interests
        shared_interests: List[str] = []
        all_overlapping_genres = set()
        for b in breakdowns:
            all_overlapping_genres.update(b.genre_overlap)
        for g in all_overlapping_genres:
            shared_interests.append(f"Multiple participants favor {g}")

        if love_count > 0:
            shared_interests.append(f"{love_count} participant(s) marked Love (❤️)")

        # Extract Compromises
        compromises_made: List[str] = []
        for b in breakdowns:
            if not b.runtime_compliant:
                compromises_made.append(f"Runtime ({movie.runtimeMinutes}m) exceeds {b.participant_name}'s preferred cap")
            if b.vote_cast == VoteTypeEnum.DISLIKE or b.vote_cast == "dislike":
                compromises_made.append(f"{b.participant_name} expressed low preference (👎)")

        scored_entries.append({
            "movie": movie,
            "compatibility_score": penalized_score,
            "veto_count": veto_count,
            "love_count": love_count,
            "breakdowns": breakdowns,
            "shared_interests": shared_interests,
            "compromises_made": compromises_made,
        })

    # Deterministic 5-Tier Tie-Breaking:
    # 1. Compatibility score (descending)
    # 2. Fewest vetoes (ascending)
    # 3. Most love votes (descending)
    # 4. Shorter runtime (ascending)
    # 5. Higher IMDb rating (descending)
    scored_entries.sort(key=lambda x: (
        -x["compatibility_score"],
        x["veto_count"],
        -x["love_count"],
        x["movie"].runtimeMinutes,
        -x["movie"].rating
    ))

    results: List[GroupRecommendationResult] = []
    for rank_idx, entry in enumerate(scored_entries, start=1):
        m = entry["movie"]
        results.append(GroupRecommendationResult(
            movie=m,
            rank=rank_idx,
            compatibility_score=entry["compatibility_score"],
            shared_interests=entry["shared_interests"],
            compromises_made=entry["compromises_made"],
            participant_breakdowns=entry["breakdowns"],
            ai_explanation=f"{m.title} achieved consensus with a {entry['compatibility_score']}% harmony rating.",
        ))

    return results

def calculate_single_match(
    movie: MovieSchema,
    preferred_moods: List[str],
    preferred_genres: List[str],
    max_age_rating: str
) -> Dict[str, Any]:
    """Calculate single user match score."""
    m_genres = [g.value if hasattr(g, 'value') else g for g in movie.genres]
    m_moods = [m.value if hasattr(m, 'value') else m for m in movie.moods]

    genre_overlap = [g for g in m_genres if g in preferred_genres]
    mood_overlap = [m for m in m_moods if m in preferred_moods]

    score = 70
    if len(genre_overlap) >= 2:
        score += 15
    elif len(genre_overlap) == 1:
        score += 10

    if len(mood_overlap) >= 1:
        score += 10

    if movie.rating >= 8.0:
        score += 4

    clamped = max(60, min(99, score))
    return {
        "match_score": clamped,
        "fit_reasons": [
            f"Overlaps with your genre interest in {genre_overlap[0]}" if genre_overlap else "General cinematic fit",
            f"Matches mood '{mood_overlap[0]}'" if mood_overlap else "High audience rating",
            f"Rated {movie.rating}/10 on IMDb"
        ],
        "tone_scores": {
            "humor": 85 if "Comedy" in m_genres else 40,
            "thrill": 90 if "Action" in m_genres or "Thriller" in m_genres else 30,
            "emotional": 85 if "Drama" in m_genres else 50,
            "pacing": 88 if "Action" in m_genres else 65
        },
        "best_for": "Family Movie Night",
        "spoiler_free_vibe_check": movie.aiInsights.spoilerFreeVibeCheck if movie.aiInsights else "Great evening discovery."
    }

SAMPLE_MOVIES: List[MovieSchema] = [
    MovieSchema(
        id="spider-verse",
        title="Spider-Man: Across the Spider-Verse",
        tagline="It’s how you wear the mask that counts.",
        synopsis="Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
        year=2023,
        runtimeMinutes=140,
        rating=8.8,
        ageRating=AgeRatingEnum.PG,
        genres=[GenreEnum.ANIMATION, GenreEnum.ACTION, GenreEnum.SCIENCE_FICTION, GenreEnum.FAMILY],
        moods=[MoodEnum.EXCITED, MoodEnum.ADVENTUROUS, MoodEnum.CURIOUS],
        familySafety=FamilySafetyNotes(
            violence="Mild comic-book stylized action and fantasy peril.",
            language="Very mild brief slang; family friendly.",
            themes="Heroism, identity, parent-teen communication.",
            ageAppropriateVerdict="Universal crowd-pleaser."
        )
    ),
    MovieSchema(
        id="paddington-2",
        title="Paddington 2",
        tagline="It takes a bear to catch a thief.",
        synopsis="Paddington takes on odd jobs to buy a pop-up book for Aunt Lucy, only to be framed for its theft in a delightful, charming London mystery.",
        year=2017,
        runtimeMinutes=99,
        rating=7.8,
        ageRating=AgeRatingEnum.PG,
        genres=[GenreEnum.COMEDY, GenreEnum.FAMILY],
        moods=[MoodEnum.HAPPY, MoodEnum.RELAXED],
        familySafety=FamilySafetyNotes(
            violence="Mild slapstick cartoon comedy.",
            language="None; completely wholesome.",
            themes="Kindness, optimism, community solidarity.",
            ageAppropriateVerdict="Heartwarming for all ages."
        )
    ),
    MovieSchema(
        id="interstellar",
        title="Interstellar",
        tagline="Mankind was born on Earth. It was never meant to die here.",
        synopsis="A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival across cosmic horizons.",
        year=2014,
        runtimeMinutes=169,
        rating=8.7,
        ageRating=AgeRatingEnum.PG_13,
        genres=[GenreEnum.SCIENCE_FICTION, GenreEnum.DRAMA],
        moods=[MoodEnum.CURIOUS, MoodEnum.ADVENTUROUS],
        familySafety=FamilySafetyNotes(
            violence="Space peril, intense atmospheric pressure, brief fistfight.",
            language="Infrequent mild language.",
            themes="Parent-child sacrifice, astrophysics, human survival.",
            ageAppropriateVerdict="Engaging for teens and adults."
        )
    ),
    MovieSchema(
        id="knives-out",
        title="Knives Out",
        tagline="Nothing brings a family together like murder.",
        synopsis="A detective investigates the death of a patriarch of an eccentric, combative family in a lavish, witty whodunnit.",
        year=2019,
        runtimeMinutes=130,
        rating=7.9,
        ageRating=AgeRatingEnum.PG_13,
        genres=[GenreEnum.COMEDY, GenreEnum.THRILLER, GenreEnum.DRAMA],
        moods=[MoodEnum.CURIOUS, MoodEnum.EXCITED],
        familySafety=FamilySafetyNotes(
            violence="A staged suicide/murder mystery premise, blood briefly shown.",
            language="Moderate language.",
            themes="Greed, family betrayal, immigration, class differences.",
            ageAppropriateVerdict="Terrific for older teens and adults."
        )
    ),
    MovieSchema(
        id="spirited-away",
        title="Spirited Away",
        tagline="Tunnel into a realm of wonder.",
        synopsis="A young girl enters a magical world ruled by spirits, witches, and gods, where humans are changed into beasts.",
        year=2001,
        runtimeMinutes=125,
        rating=8.6,
        ageRating=AgeRatingEnum.PG,
        genres=[GenreEnum.ANIMATION, GenreEnum.FAMILY, GenreEnum.SCIENCE_FICTION],
        moods=[MoodEnum.CURIOUS, MoodEnum.RELAXED, MoodEnum.ADVENTUROUS],
        familySafety=FamilySafetyNotes(
            violence="Stylized mythological monster peril, transformative curses.",
            language="None.",
            themes="Bravery, environmental respect, greed versus purity.",
            ageAppropriateVerdict="Classic anime masterpiece suitable for the whole family."
        )
    ),
    MovieSchema(
        id="la-la-land",
        title="La La Land",
        tagline="Here's to the fools who dream.",
        synopsis="While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their dreams.",
        year=2016,
        runtimeMinutes=128,
        rating=8.0,
        ageRating=AgeRatingEnum.PG_13,
        genres=[GenreEnum.COMEDY, GenreEnum.DRAMA],
        moods=[MoodEnum.ROMANTIC, MoodEnum.HAPPY],
        familySafety=FamilySafetyNotes(
            violence="None.",
            language="Brief mild profanity.",
            themes="Artistic ambition, sacrifice, romantic longing.",
            ageAppropriateVerdict="Uplifting musical romance."
        )
    ),
    MovieSchema(
        id="mad-max-fury-road",
        title="Mad Max: Fury Road",
        tagline="What a lovely day.",
        synopsis="In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.",
        year=2015,
        runtimeMinutes=120,
        rating=8.1,
        ageRating=AgeRatingEnum.R,
        genres=[GenreEnum.ACTION, GenreEnum.THRILLER, GenreEnum.SCIENCE_FICTION],
        moods=[MoodEnum.EXCITED, MoodEnum.ADVENTUROUS],
        familySafety=FamilySafetyNotes(
            violence="Continuous intense dystopian vehicular combat, grotesque characters.",
            language="Occasional strong language.",
            themes="Survival, tyranny, liberation.",
            ageAppropriateVerdict="Strictly adults and mature older teens."
        )
    ),
    MovieSchema(
        id="everything-everywhere",
        title="Everything Everywhere All at Once",
        tagline="The universe is so much bigger than you realize.",
        synopsis="A middle-aged Chinese immigrant is swept into an insane adventure in which she alone can save existence by exploring other universes.",
        year=2022,
        runtimeMinutes=139,
        rating=7.8,
        ageRating=AgeRatingEnum.R,
        genres=[GenreEnum.ACTION, GenreEnum.COMEDY, GenreEnum.SCIENCE_FICTION],
        moods=[MoodEnum.EXCITED, MoodEnum.CURIOUS],
        familySafety=FamilySafetyNotes(
            violence="Absurdist martial arts action, sexual references, surreal sight gags.",
            language="Frequent coarse language.",
            themes="Generational healing, nihilism vs empathy, immigrant family struggle.",
            ageAppropriateVerdict="Mature teens and adults."
        )
    ),
    MovieSchema(
        id="coco",
        title="Coco",
        tagline="The celebration of a lifetime.",
        synopsis="Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather.",
        year=2017,
        runtimeMinutes=105,
        rating=8.4,
        ageRating=AgeRatingEnum.PG,
        genres=[GenreEnum.ANIMATION, GenreEnum.FAMILY, GenreEnum.COMEDY],
        moods=[MoodEnum.HAPPY, MoodEnum.RELAXED],
        familySafety=FamilySafetyNotes(
            violence="Mild animated peril and skeletal characters.",
            language="None.",
            themes="Ancestry, memory, forgiveness, musical passion.",
            ageAppropriateVerdict="Emotional and colorful family favorite."
        )
    ),
    MovieSchema(
        id="toy-story",
        title="Toy Story",
        tagline="Hang on for the ride of your life.",
        synopsis="A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room.",
        year=1995,
        runtimeMinutes=81,
        rating=8.3,
        ageRating=AgeRatingEnum.G,
        genres=[GenreEnum.ANIMATION, GenreEnum.FAMILY, GenreEnum.COMEDY],
        moods=[MoodEnum.HAPPY, MoodEnum.RELAXED],
        familySafety=FamilySafetyNotes(
            violence="Mild toy peril, mutant toys look slightly scary.",
            language="None.",
            themes="Jealousy, friendship, loyalty.",
            ageAppropriateVerdict="Universal classic for every age."
        )
    )
]

def get_all_sample_movies() -> List[MovieSchema]:
    return SAMPLE_MOVIES

def get_movie_by_id(movie_id: str) -> Optional[MovieSchema]:
    for m in SAMPLE_MOVIES:
        if m.id == movie_id:
            return m
    return None

class RecommendationService:
    def get_all_sample_movies(self) -> List[MovieSchema]:
        return get_all_sample_movies()

    def get_movie_by_id(self, movie_id: str) -> Optional[MovieSchema]:
        return get_movie_by_id(movie_id)

    def filter_movies_by_restrictions(self, movies, participants):
        return filter_movies_by_restrictions(movies, participants)

    def rank_movies_for_family(self, candidate_movies, participants, votes):
        return rank_movies_for_family(candidate_movies, participants, votes)

    def calculate_single_match(self, movie, preferred_moods, preferred_genres, max_age_rating):
        return calculate_single_match(movie, preferred_moods, preferred_genres, max_age_rating)

recommendation_service = RecommendationService()

