"""Configuration for agent service."""
import os
from pydantic_settings import BaseSettings


class AgentSettings(BaseSettings):
    """Agent service settings."""

    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3:8b"
    ollama_fallback_model: str = "mistral"
    api_url: str = "http://localhost:8000"
    default_context_window_days: int = 7
    default_temperature: float = 0.3
    creative_temperature: float = 0.7

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = AgentSettings()
