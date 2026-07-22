from pathlib import Path
from typing import List, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "VerboFlete IA"

    # Definimos el tipo como una lista
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Usamos mode='before' para convertir el string del .env en una lista
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    DATABASE_URL: str = "sqlite:///./verboflete.db"
    OPENAI_API_KEY: str = ""
    SECRET_KEY: str = "dev-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    ADMIN_INIT_EMAIL: str = "admin@verboflete.com"
    ADMIN_INIT_PASSWORD: str = "password_seguro_aqui"
    ADMIN_NAME: str = "Admin"
    ADMIN_LASTNAME: str = "VerboFlete"

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()