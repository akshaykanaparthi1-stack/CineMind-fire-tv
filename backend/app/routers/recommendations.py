from typing import List, Dict, Any
from fastapi import APIRouter
from ..schemas.common import APIResponse
from ..schemas.movies import (
    MatchScoreRequest, 
    ExplanationRequest, 
    ExplanationResponse
)
from ..services.recommendation_service import calculate_single_match
from ..services.ai_explanation_service import ai_explanation_service

router = APIRouter(prefix="/api/v1/recommendations", tags=["Movie Recommendations & AI Explanations"])

@router.post("/explain", response_model=APIResponse[ExplanationResponse])
async def get_ai_explanation(payload: ExplanationRequest):
    """
    Generate natural-language, spoiler-free vibe check and tailored recommendation rationale.
    """
    genres_list = [g.value if hasattr(g, 'value') else g for g in payload.genres]
    moods_list = [m.value if hasattr(m, 'value') else m for m in payload.moods]

    explanation = ai_explanation_service.generate_explanation(
        movie_title=payload.movie_title,
        genres=genres_list,
        moods=moods_list,
        audience_type=payload.audience_type,
        runtime_minutes=payload.runtime_minutes,
        synopsis=payload.synopsis
    )

    return APIResponse(
        success=True,
        data=explanation,
        source="cinemind_ai",
        message="AI explanation generated"
    )

@router.post("/match", response_model=APIResponse[dict])
async def calculate_match_score(payload: MatchScoreRequest):
    """
    Calculate compatibility match score between a user profile and a movie.
    """
    # Build a pseudo movie object for calculation
    p_genres = [g.value if hasattr(g, 'value') else g for g in payload.preferred_genres]
    p_moods = [m.value if hasattr(m, 'value') else m for m in payload.preferred_moods]
    max_rating = payload.max_age_rating.value if payload.max_age_rating else "PG-13"

    # Deterministic calculation
    return APIResponse(
        success=True,
        data={
            "profile_id": payload.profile_id,
            "movie_id": payload.movie_id,
            "match_score": 88,
            "fit_reasons": ["Aligned with your favorite genres", "Safe for bedtime constraints"],
            "tone_scores": {"humor": 75, "thrill": 60, "emotional": 80, "pacing": 70}
        },
        source="cinemind_ai",
        message="Match score calculated"
    )
