import logging
from typing import Optional
from .base_provider import BaseAIProvider
from .bedrock_provider import BedrockProvider
from .openai_provider import OpenAICompatibleProvider
from .fallback_provider import DeterministicFallbackProvider
from ...config.settings import settings

logger = logging.getLogger("cinemind.ai.factory")

_cached_provider: Optional[BaseAIProvider] = None

def get_ai_provider(provider_override: Optional[str] = None) -> BaseAIProvider:
    """
    Factory to retrieve the appropriate AI Provider.
    Precedence:
    1. provider_override (if explicitly provided, e.g. for testing)
    2. settings.ai_provider (if explicitly configured)
    3. Amazon Bedrock (if AWS credentials are valid)
    4. OpenAI (if OPENAI_API_KEY is configured)
    5. Deterministic NLP Fallback
    """
    global _cached_provider

    target = (provider_override or settings.ai_provider or "auto").lower()

    if target == "bedrock":
        provider = BedrockProvider()
        if provider.is_configured():
            return provider
        logger.warning("Amazon Bedrock requested but not configured, falling back")
        return DeterministicFallbackProvider()

    if target == "openai":
        provider = OpenAICompatibleProvider()
        if provider.is_configured():
            return provider
        logger.warning("OpenAI requested but not configured, falling back")
        return DeterministicFallbackProvider()

    if target in ["fallback", "deterministic", "cinemind_heuristic"]:
        return DeterministicFallbackProvider()

    # "auto" detection
    # 1. Prefer Amazon Bedrock for Amazon Fire TV Track
    bedrock = BedrockProvider()
    if bedrock.is_configured():
        logger.info("Auto-selected Amazon Bedrock AI Provider")
        return bedrock

    # 2. Check OpenAI
    openai = OpenAICompatibleProvider()
    if openai.is_configured():
        logger.info("Auto-selected OpenAI Provider")
        return openai

    # 3. Deterministic NLP Fallback
    return DeterministicFallbackProvider()
