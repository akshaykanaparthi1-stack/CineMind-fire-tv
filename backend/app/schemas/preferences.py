from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .common import MoodEnum, GenreEnum, AgeRatingEnum

class ProfilePreferencesBase(BaseModel):
    favorite_moods: List[MoodEnum] = Field(default_factory=list)
    favorite_genres: List[GenreEnum] = Field(default_factory=list)
    preferred_language: str = "English"
    max_runtime_minutes: int = Field(default=150, ge=45, le=300)
    max_age_rating: AgeRatingEnum = AgeRatingEnum.PG_13
    avoid_violence: bool = False
    avoid_strong_language: bool = False
    avoid_sensitive_themes: bool = False

class ProfilePreferencesUpdate(BaseModel):
    favorite_moods: Optional[List[MoodEnum]] = None
    favorite_genres: Optional[List[GenreEnum]] = None
    preferred_language: Optional[str] = None
    max_runtime_minutes: Optional[int] = None
    max_age_rating: Optional[AgeRatingEnum] = None
    avoid_violence: Optional[bool] = None
    avoid_strong_language: Optional[bool] = None
    avoid_sensitive_themes: Optional[bool] = None

class ProfilePreferencesResponse(ProfilePreferencesBase):
    profile_id: str
    updated_at: Optional[datetime] = None

class ProfileResponse(BaseModel):
    id: str
    name: str
    avatar: str
    color: str
    role: str
    preferences: Optional[ProfilePreferencesResponse] = None
