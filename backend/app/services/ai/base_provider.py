from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from ...schemas.assistant import (
    StructuredQueryFilters,
    SingleMatchExplanation,
    GroupConsensusExplanation
)
from ...schemas.movies import MovieSchema

class BaseAIProvider(ABC):
    """
    Abstract AI Provider Interface for CineMind.
    Decouples natural-language reasoning and explanations from external LLM providers
    (Amazon Bedrock, OpenAI, or Deterministic NLP Fallback).
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the provider (e.g. 'bedrock', 'openai', 'deterministic_fallback')"""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Checks if all required credentials and client endpoints are configured and valid"""
        pass

    @abstractmethod
    async def parse_query(
        self, 
        query: str, 
        active_profile: Optional[Dict[str, Any]] = None
    ) -> StructuredQueryFilters:
        """
        Parses free-form natural language query (e.g. 'Find a funny family movie under 100 minutes')
        into structured, validated search filters.
        Detects if query lacks sufficient context to answer accurately.
        """
        pass

    @abstractmethod
    async def explain_single_match(
        self, 
        movie: MovieSchema, 
        profile: Dict[str, Any], 
        mood: Optional[str] = None
    ) -> SingleMatchExplanation:
        """
        Explains why a verified movie matches an individual user's mood and preferences.
        Guarantees spoiler-free tone.
        """
        pass

    @abstractmethod
    async def explain_group_consensus(
        self, 
        movie: MovieSchema, 
        participants: List[Dict[str, Any]], 
        compatibility_score: int
    ) -> GroupConsensusExplanation:
        """
        Explains why a verified movie suits a family or group's combined preferences,
        highlighting shared overlap and acknowledged compromises.
        """
        pass

    @abstractmethod
    async def generate_spoiler_free_summary(
        self, 
        movie: MovieSchema
    ) -> str:
        """
        Generates a concise, spoiler-free vibe check and description for television discovery.
        """
        pass
