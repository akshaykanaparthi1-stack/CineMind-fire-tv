from typing import Generic, TypeVar, Optional, List
from enum import Enum
from pydantic import BaseModel, Field

T = TypeVar("T")

class MoodEnum(str, Enum):
    HAPPY = "Happy"
    RELAXED = "Relaxed"
    EXCITED = "Excited"
    CURIOUS = "Curious"
    ROMANTIC = "Romantic"
    ADVENTUROUS = "Adventurous"

class GenreEnum(str, Enum):
    ACTION = "Action"
    COMEDY = "Comedy"
    DRAMA = "Drama"
    THRILLER = "Thriller"
    ANIMATION = "Animation"
    SCIENCE_FICTION = "Science Fiction"
    FAMILY = "Family"

class AgeRatingEnum(str, Enum):
    G = "G"
    PG = "PG"
    PG_13 = "PG-13"
    TV_14 = "TV-14"
    R = "R"
    TV_MA = "TV-MA"
    UNRATED = "Unrated"
    NR = "NR"

class VoteTypeEnum(str, Enum):
    LOVE = "love"
    LIKE = "like"
    NEUTRAL = "neutral"
    DISLIKE = "dislike"
    VETO = "veto"

class SessionStatusEnum(str, Enum):
    SETUP = "setup"
    VOTING = "voting"
    RESULTS = "results"
    COMPLETED = "completed"

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    source: str = Field(default="supabase", description="'supabase' if persisted remotely, or 'demo' if serving local demo")
