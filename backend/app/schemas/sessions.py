from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .common import MoodEnum, GenreEnum, AgeRatingEnum, VoteTypeEnum, SessionStatusEnum
from .movies import MovieSchema

class SessionCreate(BaseModel):
    title: str = "Family Movie Night"
    host_profile_id: Optional[str] = "dad"
    host_name: str = "Host"
    participant_count: int = Field(default=4, ge=2, le=6)

class SessionParticipantCreate(BaseModel):
    participant_id: str
    name: str
    avatar: str
    color: str = "#ff9900"
    is_temporary: bool = False
    preferred_moods: List[MoodEnum] = Field(default_factory=list)
    preferred_genres: List[GenreEnum] = Field(default_factory=list)
    preferred_language: str = "English"
    max_runtime_minutes: int = Field(default=120, ge=45, le=300)
    max_age_rating: AgeRatingEnum = AgeRatingEnum.PG_13
    avoid_violence: bool = False
    avoid_strong_language: bool = False
    avoid_sensitive_themes: bool = False

class VoteSubmission(BaseModel):
    participant_id: str
    movie_id: str
    vote: VoteTypeEnum

class BatchVoteSubmission(BaseModel):
    votes: List[VoteSubmission]

class ParticipantScoreBreakdown(BaseModel):
    participant_id: str
    participant_name: str
    avatar: str
    satisfaction_score: int
    vote_cast: Optional[VoteTypeEnum] = None
    genre_overlap: List[str] = Field(default_factory=list)
    mood_overlap: List[str] = Field(default_factory=list)
    runtime_compliant: bool = True

class GroupRecommendationResult(BaseModel):
    movie: MovieSchema
    rank: int
    compatibility_score: int
    shared_interests: List[str] = Field(default_factory=list)
    compromises_made: List[str] = Field(default_factory=list)
    participant_breakdowns: List[ParticipantScoreBreakdown] = Field(default_factory=list)
    ai_explanation: Optional[str] = None
    compatibility_disclaimer: str = "Normalized compatibility score (0-100) measures preference compatibility, not guaranteed individual enjoyment."

class CalculateResultsRequest(BaseModel):
    candidate_movies: List[MovieSchema]

class SessionStatusUpdate(BaseModel):
    status: SessionStatusEnum

class SelectWinnerRequest(BaseModel):
    movie_id: str
    save_to_watchlist: bool = True

class FamilySessionResponse(BaseModel):
    id: str
    title: str
    host_name: str
    participant_count: int
    status: SessionStatusEnum
    winning_movie_id: Optional[str] = None
    participants: List[SessionParticipantCreate] = Field(default_factory=list)
    votes: Dict[str, Dict[str, VoteTypeEnum]] = Field(default_factory=dict)
    results: List[GroupRecommendationResult] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
