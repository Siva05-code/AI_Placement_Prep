from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
    )

    app_name: str = "AI Placement Preparation Assistant API"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    cors_origins_raw: str = Field(
        default="http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000",
        alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def docs_enabled(self) -> bool:
        return self.environment.lower() != "production"

    @property
    def allow_credentials(self) -> bool:
        return "*" not in self.cors_origins


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
