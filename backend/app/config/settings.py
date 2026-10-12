from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    environment: str = Field(default="development", description="Runtime environment")
    port: int = Field(default=8000, description="Server port")
    host: str = Field(default="0.0.0.0", description="Server host")
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )

    supabase_url: str = Field(default="", description="Supabase project URL")
    supabase_publishable_key: str = Field(default="", description="Supabase publishable key")
    supabase_secret_key: str = Field(default="", description="Supabase service secret key")
    supabase_jwks_url: str = Field(default="", description="Supabase JWKS endpoint for JWT verification")

    ai_provider: str = Field(default="auto", description="Configured AI provider: auto | bedrock | openai | fallback")
    aws_access_key_id: str = Field(default="", description="AWS Access Key ID for Amazon Bedrock")
    aws_secret_access_key: str = Field(default="", description="AWS Secret Access Key for Amazon Bedrock")
    aws_session_token: str = Field(default="", description="AWS Session Token for temporary credentials")
    aws_region: str = Field(default="us-east-1", description="AWS Region for Amazon Bedrock")
    bedrock_model_id: str = Field(default="anthropic.claude-3-haiku-20240307-v1:0", description="Amazon Bedrock Model ID")

    openai_api_key: str = Field(default="", description="OpenAI API key for OpenAI provider")
    openai_model_id: str = Field(default="gpt-4o-mini", description="OpenAI Model ID")
    openai_base_url: str = Field(default="https://api.openai.com/v1", description="OpenAI API base URL")

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
