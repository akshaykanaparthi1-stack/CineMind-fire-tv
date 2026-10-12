from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class WatchlistItemCreate(BaseModel):
    profile_id: str
    movie_id: str
    movie_title: Optional[str] = "Movie Title"
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    age_rating: Optional[str] = "PG"
    runtime_minutes: Optional[int] = 110
    is_family_shared: Optional[bool] = True

class WatchlistItemUpdate(BaseModel):
    watched: bool

class WatchlistItemResponse(BaseModel):
    id: Optional[str] = None
    profile_id: str
    movie_id: str
    movie_title: str
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    age_rating: Optional[str] = "PG"
    runtime_minutes: Optional[int] = 110
    watched: bool = False
    added_at: Optional[datetime] = None
