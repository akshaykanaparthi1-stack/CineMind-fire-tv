from typing import List, Optional
from fastapi import APIRouter, HTTPException, Path
from ..schemas.common import APIResponse
from ..schemas.preferences import (
    ProfilePreferencesResponse, 
    ProfilePreferencesUpdate, 
    ProfileResponse
)
from ..services.supabase_service import supabase_service

router = APIRouter(prefix="/api/v1", tags=["User Preferences & Profiles"])

@router.get("/profiles", response_model=APIResponse[List[ProfileResponse]])
async def get_all_profiles():
    """List all household profiles with their current preferences."""
    profiles_list = []
    source = "demo"
    for pid in ["dad", "mom", "maya", "leo", "grandma"]:
        p, src = await supabase_service.get_profile(pid)
        source = src
        if p:
            profiles_list.append(p)
    return APIResponse(
        success=True,
        data=profiles_list,
        source=source,
        message="Household profiles retrieved"
    )

@router.get("/profiles/{profile_id}", response_model=APIResponse[ProfileResponse])
async def get_profile_by_id(profile_id: str = Path(..., description="Profile ID (e.g. dad, mom, leo)")):
    """Retrieve a single profile and its preferences."""
    profile, source = await supabase_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")
    return APIResponse(
        success=True,
        data=profile,
        source=source,
        message=f"Profile '{profile_id}' retrieved"
    )

@router.get("/preferences/{profile_id}", response_model=APIResponse[ProfilePreferencesResponse])
async def get_user_preferences(profile_id: str = Path(...)):
    """Get content & mood preferences for a profile."""
    prefs, source = await supabase_service.get_preferences(profile_id)
    if not prefs:
        raise HTTPException(status_code=404, detail=f"Preferences for '{profile_id}' not found")
    return APIResponse(
        success=True,
        data=prefs,
        source=source,
        message=f"Preferences for '{profile_id}' retrieved"
    )

@router.put("/preferences/{profile_id}", response_model=APIResponse[ProfilePreferencesResponse])
async def update_user_preferences(
    profile_id: str,
    payload: ProfilePreferencesUpdate
):
    """Update preferred moods, genres, max runtime, or mandatory restrictions."""
    updated, source = await supabase_service.update_preferences(profile_id, payload.model_dump(exclude_unset=True))
    return APIResponse(
        success=True,
        data=updated,
        source=source,
        message=f"Preferences for '{profile_id}' successfully updated"
    )
