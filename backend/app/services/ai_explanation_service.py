from typing import List, Optional
from ..schemas.movies import ExplanationResponse
from ..schemas.common import GenreEnum, MoodEnum

class AIExplanationService:
    @staticmethod
    def generate_explanation(
        movie_title: str,
        genres: List[str],
        moods: List[str],
        audience_type: str = "Family with mixed age groups",
        runtime_minutes: Optional[int] = None,
        synopsis: Optional[str] = None
    ) -> ExplanationResponse:
        """
        Generate a natural-language, spoiler-free entertainment explanation
        tailored for television viewing.
        """
        primary_genre = genres[0] if genres else "Entertainment"
        secondary_genre = genres[1] if len(genres) > 1 else ""
        primary_mood = moods[0] if moods else "Engaging"

        # Construct Headline
        if "Animation" in genres or "Family" in genres:
            headline = f"A heartwarming, visually vibrant {primary_genre} adventure that resonates across all generations."
        elif "Science Fiction" in genres or "Action" in genres:
            headline = f"An electrifying, mind-expanding spectacle with spectacular pacing and memorable set pieces."
        elif "Comedy" in genres:
            headline = f"A fast-paced, laugh-filled crowd-pleaser guaranteed to lift the living room energy."
        else:
            headline = f"A deeply compelling {primary_genre} journey featuring exceptional performances and emotional resonance."

        # Construct Spoiler-Free Vibe Check
        runtime_phrase = f"At {runtime_minutes} minutes, " if runtime_minutes else ""
        vibe_check = (
            f"{runtime_phrase}'{movie_title}' delivers a {primary_mood.lower()} atmosphere without lagging. "
            f"It balances {primary_genre.lower()} thrills with accessible emotional beats, avoiding heavy slog "
            f"while keeping {audience_type.lower()} thoroughly engaged."
        )

        # Why Watch Bullet Points
        why_watch = [
            f"Masterful blend of {primary_genre}" + (f" and {secondary_genre}" if secondary_genre else "") + " keeps viewing dynamic",
            f"Calibrated for an authentic '{primary_mood}' tone without jarring mood swings",
            f"Audience-tested pacing designed for relaxed 10-foot living room entertainment"
        ]

        # Parental Guidance Heads-Up
        if "Family" in genres or "Animation" in genres:
            parental_heads_up = "Very mild peril or comedic slapstick only; safe for kids of all ages."
        elif "Action" in genres or "Thriller" in genres:
            parental_heads_up = "Contains intense stylized action and high suspense; recommended for teens and adults."
        else:
            parental_heads_up = "General rating guidelines apply. Check specific age rating ceiling."

        return ExplanationResponse(
            headline=headline,
            vibe_check=vibe_check,
            why_watch=why_watch,
            parental_heads_up=parental_heads_up
        )

ai_explanation_service = AIExplanationService()
