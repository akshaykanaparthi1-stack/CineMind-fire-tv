from typing import List, Optional
from pydantic import BaseModel, Field
from .common import MoodEnum, GenreEnum, AgeRatingEnum
from .movies import MovieSchema

class StructuredQueryFilters(BaseModel):
    moods: List[MoodEnum] = Field(default_factory=list, description="Extracted emotional moods")
    genres: List[GenreEnum] = Field(default_factory=list, description="Extracted movie genres")
    max_runtime_minutes: Optional[int] = Field(default=None, description="Maximum allowable duration in minutes")
    max_age_rating: Optional[AgeRatingEnum] = Field(default=None, description="Strict maximum content age rating")
    avoid_violence: bool = Field(default=False, description="Flag to exclude violence/action peril")
    avoid_strong_language: bool = Field(default=False, description="Flag to exclude coarse language")
    avoid_sensitive_themes: bool = Field(default=False, description="Flag to exclude adult/dark themes")
    keywords: List[str] = Field(default_factory=list, description="Extracted thematic search keywords")
    has_sufficient_context: bool = Field(default=True, description="Whether query had enough criteria to recommend accurately")
    clarification_prompt: Optional[str] = Field(default=None, description="Clarifying suggestion if query lacked detail")

class AssistantQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language search or recommendation query")
    profile_id: Optional[str] = Field(default=None, description="Optional active profile ID for personalization and safety locks")
    session_id: Optional[str] = Field(default=None, description="Optional active Family Vote session ID")
    limit: int = Field(default=5, ge=1, le=20, description="Maximum candidate recommendations")

class AssistantQueryResponse(BaseModel):
    query: str
    parsed_filters: StructuredQueryFilters
    matched_movies: List[MovieSchema] = Field(default_factory=list)
    recommendation_explanation: str
    provider_used: str = Field(description="AI provider that generated the response: bedrock | openai | deterministic_fallback")
    has_sufficient_context: bool = True
    verified_dataset_count: int = Field(default=0, description="Total verified movies in catalog matched")
    restricted_count: int = Field(default=0, description="Count of candidate movies filtered out due to mandatory safety locks")

class SingleMatchExplanation(BaseModel):
    movie_id: str
    movie_title: str
    headline: str
    match_reasons: List[str]
    spoiler_free_vibe: str
    best_viewing_time: str
    provider_used: str = "deterministic_fallback"

class GroupConsensusExplanation(BaseModel):
    movie_id: str
    movie_title: str
    headline: str
    shared_appeal: List[str]
    compromises_highlight: List[str]
    spoiler_free_vibe: str
    family_verdict: str
    provider_used: str = "deterministic_fallback"
