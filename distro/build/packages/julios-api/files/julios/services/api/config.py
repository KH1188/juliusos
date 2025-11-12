"""Configuration management for JuliusOS API."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""

    # Database
    database_url: str = "sqlite:///./juliusos.db"

    # API
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    api_reload: bool = True

    # Ollama
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3:8b"
    ollama_fallback_model: str = "mistral"

    # App
    app_timezone: str = "America/Chicago"
    dev_mode: bool = True
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
