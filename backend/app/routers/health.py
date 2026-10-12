from fastapi import APIRouter
from ..services.supabase_service import supabase_service
from ..schemas.common import APIResponse

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
async def health_check():
    status = supabase_service.get_status()
    return {
        "status": "healthy",
        "service": "CineMind FastAPI Backend",
        "version": "1.0.0",
        "database": status
    }

@router.get("/api/v1/health", response_model=APIResponse[dict])
async def api_health_check():
    status = supabase_service.get_status()
    return APIResponse(
        success=True,
        data={
            "status": "healthy",
            "environment": "development",
            "version": "1.0.0",
            "supabase_connected": status["is_connected"],
            "database_mode": status["mode"]
        },
        source=status["mode"],
        message="FastAPI backend operational"
    )

@router.get("/api/v1/status", response_model=APIResponse[dict])
async def system_status():
    status = supabase_service.get_status()
    return APIResponse(
        success=True,
        data={
            "database_connected": status["is_connected"],
            "database_mode": status["mode"],
            "supabase_url": status["url"],
            "version": "1.0.0",
            "attribution": "Powered by CineMind and TMDB API (Not endorsed or certified by TMDB)"
        },
        source=status["mode"],
        message="System operational"
    )
