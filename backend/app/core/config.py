"""Configuración central leída desde variables de entorno (.env)."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # General
    DOMAIN: str = "elmaleconcastelldefels.com"
    APP_NAME: str = "El Malecón de la Salsa"
    ENV: str = "development"

    # Auth
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    # Admin bootstrap (primer usuario admin creado por el seed)
    ADMIN_EMAIL: str = "admin@elmaleconcastelldefels.com"
    ADMIN_PASSWORD: str = "malecon2026"

    # Segundo admin operativo
    ADMIN2_EMAIL: str = "info@elmalecondelasalsa.com"
    ADMIN2_PASSWORD: str = ""

    # Database
    POSTGRES_USER: str = "malecon"
    POSTGRES_PASSWORD: str = "malecon"
    POSTGRES_DB: str = "malecon"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = ""

    # WhatsApp
    WHATSAPP_NUMBER: str = "+34672895239"

    # Redes sociales
    FB_TOKEN: str = ""
    IG_TOKEN: str = ""
    YOUTUBE_API_KEY: str = ""
    TIKTOK_TOKEN: str = ""

    # Generación de imágenes IA
    IMAGE_AI_PROVIDER: str = ""  # claude | openai | stability | (vacío → placeholder)
    IMAGE_AI_KEY: str = ""       # clave del proveedor (para openai/stability)
    ANTHROPIC_API_KEY: str = ""  # API key de Anthropic (para proveedor claude)
    IMAGE_AI_MODEL: str = ""
    IMAGE_AI_SIZE: str = "1024x1024"

    # Pagos (fase futura)
    PAYMENT_PROVIDER: str = ""
    PAYMENT_KEY: str = ""

    # Media
    MEDIA_ROOT: str = "/data/media"

    # Temas / hojas de estilo seleccionables desde el admin.
    # Si se deja vacío, se usa frontend/src/styles del repositorio.
    THEMES_DIR: str = ""

    @property
    def themes_path(self) -> Path:
        if self.THEMES_DIR:
            return Path(self.THEMES_DIR)
        # backend/app/core/config.py -> raíz del repo (parents[3]) -> frontend/src/styles
        return Path(__file__).resolve().parents[3] / "frontend" / "src" / "styles"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
