import json
import logging
from typing import Optional, List, Dict, Any
import httpx
from .base_provider import BaseAIProvider
from .fallback_provider import DeterministicFallbackProvider
from ...schemas.assistant import (
    StructuredQueryFilters,
    SingleMatchExplanation,
    GroupConsensusExplanation
)
from ...schemas.movies import MovieSchema
from ...schemas.common import MoodEnum, GenreEnum, AgeRatingEnum
from ...config.settings import settings

logger = logging.getLogger("cinemind.ai.openai")

class OpenAICompatibleProvider(BaseAIProvider):
    """
    OpenAI-Compatible AI Provider for CineMind AI.
    Provides standard REST chat completion adapter via httpx.
    """

    def __init__(self):
        self.fallback = DeterministicFallbackProvider()

    @property
    def name(self) -> str:
        return "openai"

    def is_configured(self) -> bool:
        return bool(settings.openai_api_key and settings.openai_api_key.strip())

    async def parse_query(
        self, 
        query: str, 
        active_profile: Optional[Dict[str, Any]] = None
    ) -> StructuredQueryFilters:
        if not self.is_configured():
            return await self.fallback.parse_query(query, active_profile)

        try:
            prompt = (
                f"You are the CineMind AI Assistant on Amazon Fire TV.\n"
                f"User Query: '{query}'\n"
                f"Active Profile: {json.dumps(active_profile or {})}\n"
                f"Convert into JSON with keys: moods, genres, max_runtime_minutes, max_age_rating, "
                f"avoid_violence, avoid_strong_language, avoid_sensitive_themes, keywords, has_sufficient_context, clarification_prompt.\n"
                f"Output valid JSON only."
            )
            raw = await self._chat_complete(prompt)
            data = json.loads(raw)

            moods = [MoodEnum(m) for m in data.get("moods", []) if m in [e.value for e in MoodEnum]]
            genres = [GenreEnum(g) for g in data.get("genres", []) if g in [e.value for e in GenreEnum]]
            max_age = AgeRatingEnum(data["max_age_rating"]) if data.get("max_age_rating") in [e.value for e in AgeRatingEnum] else None

            if active_profile and (active_profile.get("role") == "Kid" or active_profile.get("maxAgeRating") in ["G", "PG"]):
                max_age = AgeRatingEnum.PG
                data["avoid_violence"] = True
                data["avoid_strong_language"] = True

            return StructuredQueryFilters(
                moods=moods,
                genres=genres,
                max_runtime_minutes=data.get("max_runtime_minutes"),
                max_age_rating=max_age,
                avoid_violence=data.get("avoid_violence", False),
                avoid_strong_language=data.get("avoid_strong_language", False),
                avoid_sensitive_themes=data.get("avoid_sensitive_themes", False),
                keywords=data.get("keywords", []),
                has_sufficient_context=data.get("has_sufficient_context", True),
                clarification_prompt=data.get("clarification_prompt")
            )
        except Exception as e:
            logger.warning(f"OpenAI query parsing failed ({e}), using fallback")
            return await self.fallback.parse_query(query, active_profile)

    async def explain_single_match(
        self, 
        movie: MovieSchema, 
        profile: Dict[str, Any], 
        mood: Optional[str] = None
    ) -> SingleMatchExplanation:
        if not self.is_configured():
            return await self.fallback.explain_single_match(movie, profile, mood)

        try:
            prompt = (
                f"Explain why this movie matches viewer {profile.get('name', 'Viewer')}:\n"
                f"Movie: {movie.title} ({movie.year}, {movie.runtimeMinutes}m, Rated {movie.ageRating.value}, Genres: {[g.value for g in movie.genres]})\n"
                f"Synopsis: {movie.synopsis}\n"
                f"Keep 100% spoiler-free. Respond with JSON: headline, match_reasons (3 items), spoiler_free_vibe, best_viewing_time."
            )
            raw = await self._chat_complete(prompt)
            data = json.loads(raw)
            return SingleMatchExplanation(
                movie_id=movie.id,
                movie_title=movie.title,
                headline=data.get("headline", f"Recommended for {profile.get('name', 'You')}"),
                match_reasons=data.get("match_reasons", [])[:3],
                spoiler_free_vibe=data.get("spoiler_free_vibe", "A cinematic crowd-pleaser."),
                best_viewing_time=data.get("best_viewing_time", "Tonight"),
                provider_used=self.name
            )
        except Exception as e:
            logger.warning(f"OpenAI single match explanation failed ({e}), using fallback")
            return await self.fallback.explain_single_match(movie, profile, mood)

    async def explain_group_consensus(
        self, 
        movie: MovieSchema, 
        participants: List[Dict[str, Any]], 
        compatibility_score: int
    ) -> GroupConsensusExplanation:
        if not self.is_configured():
            return await self.fallback.explain_group_consensus(movie, participants, compatibility_score)

        try:
            prompt = (
                f"Explain why this movie suits a family group with {compatibility_score}% compatibility score:\n"
                f"Movie: {movie.title} (Rated {movie.ageRating.value}, Genres: {[g.value for g in movie.genres]})\n"
                f"Keep strictly spoiler-free. Respond in JSON: headline, shared_appeal (list), compromises_highlight (list), spoiler_free_vibe, family_verdict."
            )
            raw = await self._chat_complete(prompt)
            data = json.loads(raw)
            return GroupConsensusExplanation(
                movie_id=movie.id,
                movie_title=movie.title,
                headline=data.get("headline", f"Group Harmony ({compatibility_score}%)"),
                shared_appeal=data.get("shared_appeal", [])[:2],
                compromises_highlight=data.get("compromises_highlight", [])[:2],
                spoiler_free_vibe=data.get("spoiler_free_vibe", "Entertaining and enjoyable for the whole family."),
                family_verdict=data.get("family_verdict", "Group approved"),
                provider_used=self.name
            )
        except Exception as e:
            logger.warning(f"OpenAI group consensus failed ({e}), using fallback")
            return await self.fallback.explain_group_consensus(movie, participants, compatibility_score)

    async def generate_spoiler_free_summary(self, movie: MovieSchema) -> str:
        if not self.is_configured():
            return await self.fallback.generate_spoiler_free_summary(movie)

        try:
            prompt = f"Provide a 1-sentence, 100% spoiler-free teaser vibe for television viewers for '{movie.title}'."
            raw = await self._chat_complete(prompt)
            return raw.strip('" \n')
        except Exception:
            return await self.fallback.generate_spoiler_free_summary(movie)

    async def _chat_complete(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.openai_model_id or "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are CineMind AI on Amazon Fire TV. You always respond accurately without inventing movies or spoiling plot twists."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{settings.openai_base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return content.strip()
