from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from .common import MoodEnum, GenreEnum, AgeRatingEnum

class ToneScores(BaseModel):
    humor: int = Field(default=50, ge=0, le=100)
    thrill: int = Field(default=50, ge=0, le=100)
    emotional: int = Field(default=50, ge=0, le=100)
    pacing: int = Field(default=50, ge=0, le=100)

class AIMatchInsights(BaseModel):
    headline: str
    matchScore: int = Field(default=85, ge=0, le=100)
    fitReasons: List[str] = Field(default_factory=list)
    toneScores: ToneScores = Field(default_factory=ToneScores)
    bestFor: str = "Family Movie Night"
    spoilerFreeVibeCheck: str

class FamilySafetyNotes(BaseModel):
    violence: str = "Low to mild peril."
    language: str = "Wholesome dialogue."
    themes: str = "Universal storytelling themes."
    ageAppropriateVerdict: str = "General audience."

class MovieSchema(BaseModel):
    id: str
    title: str
    tagline: Optional[str] = ""
    synopsis: str = ""
    year: int
    runtimeMinutes: int
    rating: float
    ageRating: AgeRatingEnum
    genres: List[GenreEnum]
    moods: List[MoodEnum] = Field(default_factory=list)
    posterUrl: Optional[str] = ""
    backdropUrl: Optional[str] = ""
    cast: List[str] = Field(default_factory=list)
    director: str = ""
    streamingProvider: Optional[str] = None
    isVerifiedStreaming: Optional[bool] = False
    verifiedStreamingDestination: Optional[str] = None
    familySafety: Optional[FamilySafetyNotes] = None
    aiInsights: Optional[AIMatchInsights] = None

class RecommendationRequest(BaseModel):
    target_moods: List[MoodEnum] = Field(default_factory=list)
    target_genres: List[GenreEnum] = Field(default_factory=list)
    max_runtime_minutes: Optional[int] = Field(default=180, ge=60, le=300)
    max_age_rating: Optional[AgeRatingEnum] = AgeRatingEnum.R
    avoid_violence: bool = False
    avoid_strong_language: bool = False
    avoid_sensitive_themes: bool = False
    limit: int = Field(default=10, ge=1, le=50)

class MatchScoreRequest(BaseModel):
    profile_id: str
    movie_id: str
    preferred_moods: List[MoodEnum] = Field(default_factory=list)
    preferred_genres: List[GenreEnum] = Field(default_factory=list)
    max_age_rating: Optional[AgeRatingEnum] = AgeRatingEnum.PG_13

class ExplanationRequest(BaseModel):
    movie_title: str
    genres: List[GenreEnum]
    moods: List[MoodEnum] = Field(default_factory=list)
    audience_type: str = "Family with kids and adults"
    runtime_minutes: Optional[int] = None
    synopsis: Optional[str] = None

class ExplanationResponse(BaseModel):
    headline: str
    vibe_check: str
    why_watch: List[str]
    parental_heads_up: Optional[str] = None
