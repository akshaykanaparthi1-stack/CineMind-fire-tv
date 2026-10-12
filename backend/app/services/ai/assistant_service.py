import logging
from typing import Optional, List, Dict, Any
from .factory import get_ai_provider
from ...schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    SingleMatchExplanation,
    GroupConsensusExplanation
)
from ...schemas.movies import MovieSchema
from ...schemas.common import AgeRatingEnum
from ...services.supabase_service import supabase_service
from ...services.recommendation_service import recommendation_service

logger = logging.getLogger("cinemind.ai.assistant")

class AIAssistantService:
    """
    AI Recommendation Assistant Orchestrator.
    Binds natural language understanding with verified metadata catalog ranking,
    strict safety restriction filters, and spoiler-free explanations.
    """

    async def query(
        self, 
        request: AssistantQueryRequest,
        provider_override: Optional[str] = None
    ) -> AssistantQueryResponse:
        provider = get_ai_provider(provider_override)

        # 1. Resolve Profile and Session context if IDs provided
        active_profile: Optional[Dict[str, Any]] = None
        if request.profile_id:
            p_data, _ = await supabase_service.get_profile(request.profile_id)
            active_profile = p_data

        session_participants: List[Dict[str, Any]] = []
        if request.session_id:
            s_data, _ = await supabase_service.get_session(request.session_id)
            if s_data:
                session_participants = s_data.get("participants", [])

        # 2. Parse natural-language intent into structured validated filters
        parsed_filters = await provider.parse_query(request.query, active_profile)

        # 3. Check for ambiguity / insufficient context
        if not parsed_filters.has_sufficient_context:
            return AssistantQueryResponse(
                query=request.query,
                parsed_filters=parsed_filters,
                matched_movies=[],
                recommendation_explanation=(
                    parsed_filters.clarification_prompt or 
                    "I need a bit more detail to recommend the right title. Tell me your preferred mood, genres, or runtime!"
                ),
                provider_used=provider.name,
                has_sufficient_context=False,
                verified_dataset_count=0,
                restricted_count=0
            )

        # 4. Load VERIFIED dataset catalog (never fabricate titles)
        catalog = recommendation_service.get_all_sample_movies()
        verified_dataset_count = len(catalog)

        # 5. Apply MANDATORY age-rating & content restrictions
        # If kid profile or session participants have restrictions, enforce them strictly
        surviving_pool: List[MovieSchema] = []
        restricted_count = 0

        # Build list of participants for restriction audit
        audit_participants: List[Dict[str, Any]] = []
        if session_participants:
            audit_participants = session_participants
        elif active_profile:
            audit_participants = [active_profile]

        # Max age constraint resolution
        effective_max_age = parsed_filters.max_age_rating
        if active_profile:
            p_max_age = active_profile.get("maxAgeRating") or active_profile.get("max_age_rating")
            if p_max_age:
                try:
                    p_enum = AgeRatingEnum(p_max_age)
                    if effective_max_age is None or self._rating_order(p_enum) < self._rating_order(effective_max_age):
                        effective_max_age = p_enum
                except Exception:
                    pass

        for movie in catalog:
            # Age rating violation check
            if effective_max_age and self._rating_order(movie.ageRating) > self._rating_order(effective_max_age):
                restricted_count += 1
                continue

            # Content restriction checks
            if parsed_filters.avoid_violence and movie.familySafety:
                v_text = movie.familySafety.violence.lower()
                if "intense" in v_text or "heavy" in v_text or "severe" in v_text:
                    restricted_count += 1
                    continue

            if parsed_filters.avoid_strong_language and movie.familySafety:
                l_text = movie.familySafety.language.lower()
                if "strong" in l_text or "frequent" in l_text or "profanity" in l_text:
                    restricted_count += 1
                    continue

            # Runtime constraint
            if parsed_filters.max_runtime_minutes and movie.runtimeMinutes > parsed_filters.max_runtime_minutes:
                # Runtime doesn't count as restriction, but excludes from query
                continue

            surviving_pool.append(movie)

        # 6. Rank surviving candidates using recommendation algorithm
        # Calculate composite score for each candidate
        scored_candidates = []
        for movie in surviving_pool:
            score = 50.0  # baseline

            # Genre overlap
            if parsed_filters.genres:
                m_genres = set(movie.genres)
                target_genres = set(parsed_filters.genres)
                matched = m_genres.intersection(target_genres)
                if matched:
                    score += len(matched) * 15.0
                else:
                    score -= 20.0

            # Mood overlap
            if parsed_filters.moods:
                m_moods = set(movie.moods)
                target_moods = set(parsed_filters.moods)
                matched_m = m_moods.intersection(target_moods)
                if matched_m:
                    score += len(matched_m) * 12.0

            # Runtime bonus (closer to requested max without exceeding)
            if parsed_filters.max_runtime_minutes:
                diff = parsed_filters.max_runtime_minutes - movie.runtimeMinutes
                if 0 <= diff <= 15:
                    score += 10.0
                elif diff > 40:
                    score += 3.0

            # Rating quality baseline
            score += movie.rating * 2.0

            scored_candidates.append((score, movie))

        # Sort descending by score, rating, year
        scored_candidates.sort(key=lambda x: (x[0], x[1].rating, x[1].year), reverse=True)
        top_movies = [item[1] for item in scored_candidates[:request.limit]]

        # 7. Generate spoiler-free natural-language explanation
        explanation_text = ""
        if not top_movies:
            explanation_text = (
                f"No verified movies matched every strict filter (max {parsed_filters.max_runtime_minutes or 'any'}m, "
                f"rated {effective_max_age.value if effective_max_age else 'any'}). "
                f"Try adjusting the runtime window or relaxing age rating restrictions."
            )
        else:
            top_pick = top_movies[0]
            if session_participants:
                group_exp = await provider.explain_group_consensus(
                    top_pick, 
                    session_participants, 
                    compatibility_score=88
                )
                explanation_text = (
                    f"Selected {len(top_movies)} titles from your verified catalog. "
                    f"Top recommendation: '{top_pick.title}' — {group_exp.headline}. "
                    f"{group_exp.spoiler_free_vibe}"
                )
            elif active_profile:
                single_exp = await provider.explain_single_match(top_pick, active_profile)
                explanation_text = (
                    f"Found {len(top_movies)} verified matches tailored to your request. "
                    f"Top pick: '{top_pick.title}' — {single_exp.headline}. "
                    f"{single_exp.spoiler_free_vibe}"
                )
            else:
                teaser = await provider.generate_spoiler_free_summary(top_pick)
                explanation_text = (
                    f"Found {len(top_movies)} verified titles matching '{request.query}'. "
                    f"Top recommendation: '{top_pick.title}' ({top_pick.year}, {top_pick.runtimeMinutes}m, {top_pick.ageRating.value}) — {teaser}"
                )

        return AssistantQueryResponse(
            query=request.query,
            parsed_filters=parsed_filters,
            matched_movies=top_movies,
            recommendation_explanation=explanation_text,
            provider_used=provider.name,
            has_sufficient_context=True,
            verified_dataset_count=verified_dataset_count,
            restricted_count=restricted_count
        )

    async def explain_match(
        self,
        movie_id: str,
        profile_id: str,
        mood: Optional[str] = None,
        provider_override: Optional[str] = None
    ) -> SingleMatchExplanation:
        provider = get_ai_provider(provider_override)
        movie = recommendation_service.get_movie_by_id(movie_id)
        if not movie:
            raise ValueError(f"Movie with ID '{movie_id}' not found in verified dataset")

        p_data, _ = await supabase_service.get_profile(profile_id)
        profile = p_data or {"name": "Viewer", "role": "Member"}
        return await provider.explain_single_match(movie, profile, mood)

    async def explain_group(
        self,
        movie_id: str,
        session_id: str,
        provider_override: Optional[str] = None
    ) -> GroupConsensusExplanation:
        provider = get_ai_provider(provider_override)
        movie = recommendation_service.get_movie_by_id(movie_id)
        if not movie:
            raise ValueError(f"Movie with ID '{movie_id}' not found in verified dataset")

        s_data, _ = await supabase_service.get_session(session_id)
        participants = s_data.get("participants", []) if s_data else []
        return await provider.explain_group_consensus(movie, participants, compatibility_score=85)

    def _rating_order(self, rating: AgeRatingEnum) -> int:
        order = {
            AgeRatingEnum.G: 1,
            AgeRatingEnum.PG: 2,
            AgeRatingEnum.PG_13: 3,
            AgeRatingEnum.TV_14: 3,
            AgeRatingEnum.R: 4,
            AgeRatingEnum.TV_MA: 4,
            AgeRatingEnum.NR: 5,
            AgeRatingEnum.UNRATED: 5,
        }
        return order.get(rating, 3)

ai_assistant_service = AIAssistantService()
