from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Path
from ..schemas.common import APIResponse
from ..schemas.watchlist import (
    WatchlistItemCreate, 
    WatchlistItemUpdate, 
    WatchlistItemResponse
)
from ..services.supabase_service import supabase_service

router = APIRouter(prefix="/api/v1/watchlist", tags=["User & Shared Watchlists"])

@router.get("", response_model=APIResponse[List[WatchlistItemResponse]])
async def get_watchlist(
    profile_id: Optional[str] = Query(default=None, description="Optional profile ID to filter watchlist items (or 'all' for household queue)")
):
    """Retrieve shared household or profile-specific watchlist."""
    items, source = await supabase_service.get_watchlist(profile_id)
    return APIResponse(
        success=True,
        data=items,
        source=source,
        message=f"Retrieved {len(items)} watchlist items"
    )

@router.post("", response_model=APIResponse[WatchlistItemResponse])
async def add_to_watchlist(payload: WatchlistItemCreate):
    """Add a movie title to the household watchlist."""
    item, source = await supabase_service.add_to_watchlist(payload.model_dump())
    return APIResponse(
        success=True,
        data=item,
        source=source,
        message=f"'{payload.movie_title}' added to watchlist"
    )

@router.delete("/{profile_id}/{movie_id}", response_model=APIResponse[dict])
async def remove_from_watchlist(
    profile_id: str = Path(...),
    movie_id: str = Path(...)
):
    """Remove a movie from the watchlist."""
    removed, source = await supabase_service.remove_from_watchlist(profile_id, movie_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return APIResponse(
        success=True,
        data={"profile_id": profile_id, "movie_id": movie_id, "removed": True},
        source=source,
        message="Removed from watchlist"
    )

@router.patch("/{profile_id}/{movie_id}", response_model=APIResponse[WatchlistItemResponse])
async def toggle_watched(
    profile_id: str = Path(...),
    movie_id: str = Path(...),
    payload: WatchlistItemUpdate = ...
):
    """Toggle the watched status of a movie in the watchlist."""
    updated, source = await supabase_service.toggle_watched(profile_id, movie_id, payload.watched)
    if not updated:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return APIResponse(
        success=True,
        data=updated,
        source=source,
        message=f"Movie marked as {'watched' if payload.watched else 'unwatched'}"
    )
