import json
import logging
import os
from typing import Optional, List, Dict, Any
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

logger = logging.getLogger("cinemind.ai.bedrock")

class BedrockProvider(BaseAIProvider):
    """
    Amazon Bedrock AI Provider for CineMind AI.
    Preferred provider for Amazon Fire TV integration.
    Invokes Anthropic Claude or Amazon Titan via AWS Bedrock Runtime.
    """

    def __init__(self):
        self.fallback = DeterministicFallbackProvider()
        self._client = None
        self._init_client()

    def _init_client(self):
        try:
            import boto3
            # Check credentials from settings or ambient environment
            key_id = settings.aws_access_key_id or os.environ.get("AWS_ACCESS_KEY_ID")
            secret_key = settings.aws_secret_access_key or os.environ.get("AWS_SECRET_ACCESS_KEY")
            session_token = settings.aws_session_token or os.environ.get("AWS_SESSION_TOKEN")
            region = settings.aws_region or os.environ.get("AWS_REGION", "us-east-1")

            if key_id and secret_key:
                kwargs = {
                    "service_name": "bedrock-runtime",
                    "region_name": region,
                    "aws_access_key_id": key_id,
                    "aws_secret_access_key": secret_key,
                }
                if session_token:
                    kwargs["aws_session_token"] = session_token
                self._client = boto3.client(**kwargs)
            elif os.environ.get("AWS_DEFAULT_REGION") or os.environ.get("AWS_REGION"):
                # Attempt default boto3 credential resolution (IAM role, AWS CLI config)
                self._client = boto3.client("bedrock-runtime", region_name=region)
        except Exception as e:
            logger.warning(f"Could not initialize Amazon Bedrock client: {e}")
            self._client = None

    @property
    def name(self) -> str:
        return "bedrock"

    def is_configured(self) -> bool:
        return self._client is not None

    async def parse_query(
        self, 
        query: str, 
        active_profile: Optional[Dict[str, Any]] = None
    ) -> StructuredQueryFilters:
        if not self.is_configured():
            return await self.fallback.parse_query(query, active_profile)

        try:
            prompt = (
                f"You are the CineMind AI Assistant for Amazon Fire TV.\n"
                f"Analyze this entertainment request: '{query}'\n"
                f"Active Profile: {json.dumps(active_profile or {})}\n"
                f"Convert the user's intent into JSON with these exact fields:\n"
                f"- moods: list of strings (allowed: Happy, Relaxed, Excited, Curious, Romantic, Adventurous)\n"
                f"- genres: list of strings (allowed: Action, Comedy, Drama, Thriller, Animation, Science Fiction, Family)\n"
                f"- max_runtime_minutes: integer or null\n"
                f"- max_age_rating: string or null (allowed: G, PG, PG-13, TV-14, R)\n"
                f"- avoid_violence: boolean\n"
                f"- avoid_strong_language: boolean\n"
                f"- avoid_sensitive_themes: boolean\n"
                f"- keywords: list of strings\n"
                f"- has_sufficient_context: boolean (false if query is too vague to search accurately)\n"
                f"- clarification_prompt: string or null\n"
                f"Respond ONLY with valid JSON."
            )

            raw_text = self._invoke_bedrock(prompt)
            data = json.loads(raw_text)

            # Map into validated schema
            moods = [MoodEnum(m) for m in data.get("moods", []) if m in [e.value for e in MoodEnum]]
            genres = [GenreEnum(g) for g in data.get("genres", []) if g in [e.value for e in GenreEnum]]
            max_age = AgeRatingEnum(data["max_age_rating"]) if data.get("max_age_rating") in [e.value for e in AgeRatingEnum] else None

            # Enforce active profile restrictions if kid profile
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
            logger.warning(f"Bedrock query parsing failed ({e}), falling back to deterministic parser")
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
                f"You are the CineMind AI Assistant on Amazon Fire TV.\n"
                f"Movie: {movie.title} ({movie.year}, {movie.runtimeMinutes}m, Rated {movie.ageRating.value}, Genres: {[g.value for g in movie.genres]})\n"
                f"Synopsis: {movie.synopsis}\n"
                f"User Profile: {profile.get('name', 'Viewer')}, Preferred Mood: {mood or 'Any'}\n"
                f"Provide a concise, 100% SPOILER-FREE explanation of why this movie is a great match.\n"
                f"Respond in JSON with:\n"
                f"- headline: punchy title\n"
                f"- match_reasons: list of 3 short bullet points\n"
                f"- spoiler_free_vibe: 2 sentence vibe check\n"
                f"- best_viewing_time: string\n"
                f"Respond ONLY with valid JSON."
            )
            raw_text = self._invoke_bedrock(prompt)
            data = json.loads(raw_text)
            return SingleMatchExplanation(
                movie_id=movie.id,
                movie_title=movie.title,
                headline=data.get("headline", f"Recommended for {profile.get('name', 'You')}"),
                match_reasons=data.get("match_reasons", [])[:3],
                spoiler_free_vibe=data.get("spoiler_free_vibe", "A cinematic treat with balanced tone."),
                best_viewing_time=data.get("best_viewing_time", "Tonight"),
                provider_used=self.name
            )
        except Exception as e:
            logger.warning(f"Bedrock single match explanation failed ({e}), falling back")
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
                f"You are the CineMind AI Assistant on Amazon Fire TV.\n"
                f"Explain why this movie suits a family voting group:\n"
                f"Movie: {movie.title} (Rated {movie.ageRating.value}, Genres: {[g.value for g in movie.genres]})\n"
                f"Participants: {[{'name': p.get('name'), 'role': p.get('role')} for p in participants]}\n"
                f"Group Compatibility Score: {compatibility_score}%\n"
                f"Rules: NO SPOILERS. Explain shared overlap and compromises.\n"
                f"Respond in JSON with: headline, shared_appeal (list of strings), compromises_highlight (list of strings), spoiler_free_vibe (string), family_verdict (string).\n"
                f"Respond ONLY with valid JSON."
            )
            raw_text = self._invoke_bedrock(prompt)
            data = json.loads(raw_text)
            return GroupConsensusExplanation(
                movie_id=movie.id,
                movie_title=movie.title,
                headline=data.get("headline", f"Family Pick ({compatibility_score}% Harmony)"),
                shared_appeal=data.get("shared_appeal", [])[:2],
                compromises_highlight=data.get("compromises_highlight", [])[:2],
                spoiler_free_vibe=data.get("spoiler_free_vibe", "Engaging and enjoyable for the whole room."),
                family_verdict=data.get("family_verdict", "Group approved"),
                provider_used=self.name
            )
        except Exception as e:
            logger.warning(f"Bedrock group consensus explanation failed ({e}), falling back")
            return await self.fallback.explain_group_consensus(movie, participants, compatibility_score)

    async def generate_spoiler_free_summary(self, movie: MovieSchema) -> str:
        if not self.is_configured():
            return await self.fallback.generate_spoiler_free_summary(movie)

        try:
            prompt = (
                f"Provide a 1-sentence, 100% spoiler-free teaser vibe check for television viewers for '{movie.title}'. "
                f"Genres: {[g.value for g in movie.genres]}, Rating: {movie.ageRating.value}."
            )
            raw = self._invoke_bedrock(prompt).strip()
            return raw.strip('"')
        except Exception:
            return await self.fallback.generate_spoiler_free_summary(movie)

    def _invoke_bedrock(self, prompt: str) -> str:
        model_id = settings.bedrock_model_id or "anthropic.claude-3-haiku-20240307-v1:0"

        if "claude" in model_id.lower():
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1024,
                "temperature": 0.2,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            res = self._client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload)
            )
            res_body = json.loads(res["body"].read().decode())
            text = res_body["content"][0]["text"].strip()
            # Clean markdown code blocks if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return text.strip()
        else:
            # Amazon Titan or generic model format
            payload = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 1024,
                    "temperature": 0.2
                }
            }
            res = self._client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload)
            )
            res_body = json.loads(res["body"].read().decode())
            results = res_body.get("results", [])
            text = results[0]["outputText"].strip() if results else ""
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return text.strip()
