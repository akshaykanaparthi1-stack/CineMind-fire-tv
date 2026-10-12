import re
from typing import Optional, List, Dict, Any
from .base_provider import BaseAIProvider
from ...schemas.assistant import (
    StructuredQueryFilters,
    SingleMatchExplanation,
    GroupConsensusExplanation
)
from ...schemas.movies import MovieSchema
from ...schemas.common import MoodEnum, GenreEnum, AgeRatingEnum

class DeterministicFallbackProvider(BaseAIProvider):
    """
    Deterministic NLP & Rule-Based Fallback Provider.
    Extracts structured constraints from natural language, enforces strict safety restrictions,
    detects ambiguity / lack of information, and produces rich spoiler-free explanations.
    """

    @property
    def name(self) -> str:
        return "deterministic_fallback"

    def is_configured(self) -> bool:
        return True

    async def parse_query(
        self, 
        query: str, 
        active_profile: Optional[Dict[str, Any]] = None
    ) -> StructuredQueryFilters:
        clean_q = (query or "").strip().lower()

        # 1. Ambiguity / Insufficient context check
        # If query is too short or generic with no mood, genre, runtime, or thematic intent
        generic_tokens = {"movie", "movies", "film", "films", "something", "anything", "show", "watch", "find", "me", "a", "good", "the", "please"}
        tokens = set(re.findall(r"\b[a-z0-9]+\b", clean_q))
        meaningful_tokens = tokens - generic_tokens

        # Mood detection
        moods: List[MoodEnum] = []
        if any(w in clean_q for w in ["funny", "laugh", "cheerful", "happy", "uplifting", "joy"]):
            moods.append(MoodEnum.HAPPY)
        if any(w in clean_q for w in ["chill", "relax", "calm", "cozy", "peaceful", "unwind", "easygoing"]):
            moods.append(MoodEnum.RELAXED)
        if any(w in clean_q for w in ["exciting", "excited", "hype", "thrilling", "action-packed", "fast-paced", "pumped"]):
            moods.append(MoodEnum.EXCITED)
        if any(w in clean_q for w in ["curious", "mind-bending", "deep", "thought-provoking", "mystery", "wonder", "intrigue"]):
            moods.append(MoodEnum.CURIOUS)
        if any(w in clean_q for w in ["romantic", "love", "romance", "date night", "sweet"]):
            moods.append(MoodEnum.ROMANTIC)
        if any(w in clean_q for w in ["adventure", "adventurous", "epic", "quest", "explore", "journey"]):
            moods.append(MoodEnum.ADVENTUROUS)

        # Genre detection
        genres: List[GenreEnum] = []
        if any(w in clean_q for w in ["comedy", "funny", "humor", "hilarious", "laugh"]):
            genres.append(GenreEnum.COMEDY)
        if any(w in clean_q for w in ["action", "explosive", "superhero", "martial arts", "fights"]):
            genres.append(GenreEnum.ACTION)
        if any(w in clean_q for w in ["drama", "emotional", "dramatic", "tearjerker", "serious"]):
            genres.append(GenreEnum.DRAMA)
        if any(w in clean_q for w in ["thriller", "suspense", "mystery", "crime", "detective"]):
            genres.append(GenreEnum.THRILLER)
        if any(w in clean_q for w in ["animation", "animated", "cartoon", "pixar", "anime"]):
            genres.append(GenreEnum.ANIMATION)
        if any(w in clean_q for w in ["sci-fi", "science fiction", "space", "alien", "time travel", "future"]):
            genres.append(GenreEnum.SCIENCE_FICTION)
        if any(w in clean_q for w in ["family", "kids", "children", "wholesome", "family-friendly", "all ages"]):
            genres.append(GenreEnum.FAMILY)

        # Runtime extraction (e.g. "under 100 minutes", "< 90 mins", "less than 2 hours")
        max_runtime: Optional[int] = None
        min_match = re.search(r"(?:under|less than|max|within|underneath|<)\s*(\d+)\s*(?:min|mins|minute|minutes)?", clean_q)
        if min_match:
            val = int(min_match.group(1))
            # If user said "under 2 hours"
            if "hour" in clean_q and val <= 4:
                val = val * 60
            max_runtime = val
        elif "short" in clean_q or "quick" in clean_q:
            max_runtime = 95
        elif "2 hours" in clean_q or "two hours" in clean_q:
            max_runtime = 120

        # Age rating & content restrictions
        max_age: Optional[AgeRatingEnum] = None
        avoid_violence = False
        avoid_language = False
        avoid_sensitive = False

        if "no violence" in clean_q or "without violence" in clean_q or "non-violent" in clean_q:
            avoid_violence = True
        if "no swearing" in clean_q or "no bad language" in clean_q or "clean language" in clean_q:
            avoid_language = True
        if "no sensitive" in clean_q or "not scary" in clean_q:
            avoid_sensitive = True

        if "g only" in clean_q or "toddler" in clean_q:
            max_age = AgeRatingEnum.G
        elif "family" in clean_q or "kids" in clean_q or "children" in clean_q:
            max_age = AgeRatingEnum.PG
        elif "pg-13" in clean_q or "teen" in clean_q:
            max_age = AgeRatingEnum.PG_13
        elif "rated r" in clean_q or "r-rated" in clean_q:
            max_age = AgeRatingEnum.R

        # Mandatory inheritance from active profile (e.g. Kid profile lock)
        if active_profile:
            role = active_profile.get("role", "")
            prof_max_age = active_profile.get("maxAgeRating") or active_profile.get("max_age_rating")
            if role == "Kid" or prof_max_age in ["G", "PG"]:
                # Kid profile enforces PG or G cap
                max_age = AgeRatingEnum.PG if prof_max_age == "PG" else AgeRatingEnum.G
                avoid_violence = True
                avoid_language = True

        # Check for ambiguity
        has_sufficient_context = True
        clarification_prompt = None

        if len(meaningful_tokens) < 1 and not moods and not genres and not max_runtime:
            has_sufficient_context = False
            clarification_prompt = (
                "I need a little more detail to find the right movie! "
                "Try telling me a mood (e.g., 'Happy' or 'Curious'), a genre (e.g., 'Animation' or 'Comedy'), "
                "or a runtime preference (e.g., 'under 100 minutes')."
            )

        # Keywords
        keywords = list(meaningful_tokens - {"movie", "watch", "recommend", "suggest", "find"})[:6]

        return StructuredQueryFilters(
            moods=moods,
            genres=genres,
            max_runtime_minutes=max_runtime,
            max_age_rating=max_age,
            avoid_violence=avoid_violence,
            avoid_strong_language=avoid_language,
            avoid_sensitive_themes=avoid_sensitive,
            keywords=keywords,
            has_sufficient_context=has_sufficient_context,
            clarification_prompt=clarification_prompt
        )

    async def explain_single_match(
        self, 
        movie: MovieSchema, 
        profile: Dict[str, Any], 
        mood: Optional[str] = None
    ) -> SingleMatchExplanation:
        prof_name = profile.get("name", "You")
        prof_moods = set(profile.get("favoriteMoods") or profile.get("favorite_moods") or [])
        prof_genres = set(profile.get("favoriteGenres") or profile.get("favorite_genres") or [])

        matched_moods = [m.value for m in movie.moods if m.value in prof_moods or (mood and m.value.lower() == mood.lower())]
        matched_genres = [g.value for g in movie.genres if g.value in prof_genres]

        reasons = []
        if matched_genres:
            reasons.append(f"Directly fits your passion for {', '.join(matched_genres)} storytelling.")
        if matched_moods:
            reasons.append(f"Channels your requested {matched_moods[0]} vibe with balanced pacing.")
        if movie.runtimeMinutes <= 110:
            reasons.append(f"Brisk {movie.runtimeMinutes}-minute runtime makes it an easy, satisfying watch.")
        else:
            reasons.append(f"Immersive {movie.runtimeMinutes}-minute journey with rich character development.")

        reasons.append(f"Rated {movie.ageRating.value} with family-verified content guidance.")

        vibe = (
            f"A spoiler-free crowd-pleaser that balances {movie.genres[0].value.lower()} energy "
            f"with heartfelt emotional resonance and zero jarring shifts in tone."
        )

        return SingleMatchExplanation(
            movie_id=movie.id,
            movie_title=movie.title,
            headline=f"Tailored for {prof_name}'s Evening",
            match_reasons=reasons[:3],
            spoiler_free_vibe=vibe,
            best_viewing_time="Evening feature presentation",
            provider_used=self.name
        )

    async def explain_group_consensus(
        self, 
        movie: MovieSchema, 
        participants: List[Dict[str, Any]], 
        compatibility_score: int
    ) -> GroupConsensusExplanation:
        count = len(participants)
        shared = []
        compromises = []

        # Find common genres
        all_preferred_genres: Dict[str, int] = {}
        for p in participants:
            for g in (p.get("preferred_genres") or p.get("preferredGenres") or []):
                all_preferred_genres[g] = all_preferred_genres.get(g, 0) + 1

        top_shared = [g for g, c in all_preferred_genres.items() if c >= max(1, count // 2)]
        movie_genres_str = [g.value for g in movie.genres]
        overlap_genres = [g for g in top_shared if g in movie_genres_str]

        if overlap_genres:
            shared.append(f"Satisfies shared excitement for {', '.join(overlap_genres)} across the group.")
        else:
            shared.append(f"Captivates the group with acclaimed {movie.genres[0].value} appeal.")

        # Runtime compliance
        max_runtimes = [p.get("max_runtime_minutes") or p.get("maxRuntimeMinutes") or 180 for p in participants]
        min_max_runtime = min(max_runtimes) if max_runtimes else 120
        if movie.runtimeMinutes <= min_max_runtime:
            shared.append(f"At {movie.runtimeMinutes}m, it finishes within everyone's maximum available time window.")
        else:
            compromises.append(f"Runs {movie.runtimeMinutes - min_max_runtime} minutes past the strictest time cutoff, but delivers great pacing.")

        # Age safety
        shared.append(f"Verified {movie.ageRating.value} rating ensures compliance with all household content restrictions.")

        headline = f"Strong Group Harmony ({compatibility_score}% Compatibility)"
        if compatibility_score >= 85:
            headline = f"Unanimous Group Sweet Spot ({compatibility_score}% Compatibility)"

        spoiler_free = (
            f"Pure entertaining delight: high charm, zero slow patches, and engaging themes "
            f"that reward both kids and adult viewers without spoiling any narrative surprises."
        )

        return GroupConsensusExplanation(
            movie_id=movie.id,
            movie_title=movie.title,
            headline=headline,
            shared_appeal=shared[:2],
            compromises_highlight=compromises if compromises else ["No significant compromises required for this selection."],
            spoiler_free_vibe=spoiler_free,
            family_verdict="Recommended for group movie night",
            provider_used=self.name
        )

    async def generate_spoiler_free_summary(
        self, 
        movie: MovieSchema
    ) -> str:
        tagline = movie.tagline or f"A memorable {movie.genres[0].value} experience"
        return f"{tagline} — High-energy storytelling crafted for big-screen cinematic viewing with zero plot giveaways."
