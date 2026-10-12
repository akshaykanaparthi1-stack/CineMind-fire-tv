from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..schemas.common import APIResponse
from ..schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    SingleMatchExplanation,
    GroupConsensusExplanation
)
from ..services.ai.assistant_service import ai_assistant_service
from ..services.ai.factory import get_ai_provider
from ..config.settings import settings

router = APIRouter(prefix="/api/v1/assistant", tags=["AI Recommendation Assistant"])

@router.post("/query", response_model=APIResponse[AssistantQueryResponse])
async def assistant_query(
    request: AssistantQueryRequest,
    provider: Optional[str] = Query(None, description="Optional provider override: bedrock | openai | fallback")
):
    """
    Natural-Language Recommendation Assistant Endpoint.
    Accepts conversational requests (e.g., 'Find a funny family movie under 100 minutes'),
    extracts structured filters, validates against verified dataset catalog,
    enforces mandatory age/content restrictions, and returns spoiler-free AI recommendations.
    """
    try:
        res = await ai_assistant_service.query(request, provider_override=provider)
        return APIResponse(
            success=True,
            data=res,
            source=res.provider_used,
            message="Query interpreted and ranked successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant processing failed: {str(e)}")

@router.post("/explain-match", response_model=APIResponse[SingleMatchExplanation])
async def explain_single_match(
    movie_id: str = Query(..., description="Target movie ID from verified dataset"),
    profile_id: str = Query(..., description="Active user profile ID"),
    mood: Optional[str] = Query(None, description="Optional user mood"),
    provider: Optional[str] = Query(None, description="Optional provider override")
):
    """
    Explains why a verified movie matches an individual user's preferences and current mood.
    """
    try:
        exp = await ai_assistant_service.explain_match(
            movie_id=movie_id,
            profile_id=profile_id,
            mood=mood,
            provider_override=provider
        )
        return APIResponse(
            success=True,
            data=exp,
            source=exp.provider_used,
            message="Match explanation generated"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain-group", response_model=APIResponse[GroupConsensusExplanation])
async def explain_group_consensus(
    movie_id: str = Query(..., description="Target movie ID from verified dataset"),
    session_id: str = Query(..., description="Active Family Vote session ID"),
    provider: Optional[str] = Query(None, description="Optional provider override")
):
    """
    Explains why a verified movie suits a family voting group's combined preferences.
    """
    try:
        exp = await ai_assistant_service.explain_group(
            movie_id=movie_id,
            session_id=session_id,
            provider_override=provider
        )
        return APIResponse(
            success=True,
            data=exp,
            source=exp.provider_used,
            message="Group consensus explanation generated"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/provider-status", response_model=APIResponse[dict])
async def get_provider_status():
    """
    Returns AI provider diagnostic status and credential readiness.
    """
    active_provider = get_ai_provider()
    return APIResponse(
        success=True,
        data={
            "active_provider": active_provider.name,
            "configured_mode": settings.ai_provider,
            "amazon_bedrock": {
                "available": bool(settings.aws_access_key_id and settings.aws_secret_access_key),
                "model_id": settings.bedrock_model_id,
                "region": settings.aws_region
            },
            "openai": {
                "available": bool(settings.openai_api_key),
                "model_id": settings.openai_model_id
            },
            "deterministic_fallback": {
                "available": True,
                "description": "Rule-based NLP engine & spoiler-free template reasoning"
            }
        },
        source=active_provider.name,
        message="AI Provider status retrieved"
    )
