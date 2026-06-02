"""Punto de entrada de la API de El Malecón de la Salsa."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
import app.models  # noqa: F401  (registra todas las tablas)
from app.routers import (
    auth, public, students, teachers, courses, events, leads, enrollments,
    stats, media, images, themes, video_settings,
)

app = FastAPI(title="El Malecón de la Salsa — API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENV == "development" else [f"https://{settings.DOMAIN}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.media_root, exist_ok=True)
    # Migraciones incrementales — ADD COLUMN IF NOT EXISTS es idempotente en PostgreSQL
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_focal VARCHAR DEFAULT '50% 50%'"
        ))
        conn.execute(text(
            "ALTER TABLE events ADD COLUMN IF NOT EXISTS image_focal VARCHAR DEFAULT '50% 50%'"
        ))
        conn.commit()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}


# Servir media (imágenes, vídeos, CV en PDF, etc.)
if os.path.isdir(settings.media_root):
    app.mount("/media", StaticFiles(directory=settings.media_root), name="media")

for r in (auth, public, students, teachers, courses, events, leads, enrollments,
          stats, media, images, themes, video_settings):
    app.include_router(r.router)

# Endpoints públicos
app.include_router(themes.public_router)
app.include_router(video_settings.public_router)
