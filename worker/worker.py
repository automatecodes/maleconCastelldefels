"""Worker de tareas en segundo plano.

Refresca la caché de publicaciones de redes sociales (Facebook, Instagram,
YouTube, TikTok). Si no hay tokens en .env, mantiene los placeholders del seed
y vuelve a intentarlo en el siguiente ciclo. Pensado para ampliarse con tareas
programadas (recordatorios, limpieza, etc.).
"""
import os
import time
from datetime import datetime, timezone

import httpx
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import sessionmaker, declarative_base

REFRESH_SECONDS = int(os.getenv("SOCIAL_REFRESH_SECONDS", "1800"))  # 30 min

DB_URL = (
    f"postgresql+psycopg2://{os.getenv('POSTGRES_USER','malecon')}:"
    f"{os.getenv('POSTGRES_PASSWORD','malecon')}@{os.getenv('POSTGRES_HOST','db')}:"
    f"{os.getenv('POSTGRES_PORT','5432')}/{os.getenv('POSTGRES_DB','malecon')}"
)

Base = declarative_base()


class SocialPost(Base):
    __tablename__ = "social_posts"
    id = Column(Integer, primary_key=True)
    platform = Column(String, nullable=False)
    external_id = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    text = Column(Text, nullable=True)
    permalink = Column(String, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    cached_at = Column(DateTime(timezone=True), server_default=func.now())


def fetch_instagram(token: str) -> list[dict]:
    """Instagram Graph API — últimas publicaciones."""
    url = "https://graph.instagram.com/me/media"
    params = {"fields": "id,caption,media_url,thumbnail_url,permalink,timestamp",
              "access_token": token, "limit": 8}
    r = httpx.get(url, params=params, timeout=20)
    r.raise_for_status()
    out = []
    for item in r.json().get("data", []):
        out.append({
            "platform": "instagram", "external_id": item.get("id"),
            "thumbnail_url": item.get("thumbnail_url") or item.get("media_url"),
            "text": (item.get("caption") or "")[:280],
            "permalink": item.get("permalink"),
            "published_at": item.get("timestamp"),
        })
    return out


def fetch_youtube(api_key: str, channel_handle: str = "elmaleconcastelldefels") -> list[dict]:
    """YouTube Data API v3 — vídeos recientes por búsqueda de canal."""
    # Requiere channel_id real; aquí se deja la llamada preparada.
    return []


def refresh(session) -> None:
    fb = os.getenv("FB_TOKEN", "")
    ig = os.getenv("IG_TOKEN", "")
    yt = os.getenv("YOUTUBE_API_KEY", "")
    tk = os.getenv("TIKTOK_TOKEN", "")

    collected: list[dict] = []
    try:
        if ig:
            collected += fetch_instagram(ig)
        if yt:
            collected += fetch_youtube(yt)
        # FB y TikTok: añadir cuando haya tokens y permisos de la app.
    except Exception as exc:  # noqa: BLE001
        print(f"[worker] error obteniendo redes: {exc}")
        return

    if not collected:
        print("[worker] sin tokens de redes válidos; se conservan los placeholders.")
        return

    # Reemplaza la caché con lo obtenido (solo plataformas con datos reales).
    platforms = {c["platform"] for c in collected}
    session.query(SocialPost).filter(SocialPost.platform.in_(platforms)).delete(
        synchronize_session=False)
    for c in collected:
        pub = c.get("published_at")
        if isinstance(pub, str):
            try:
                pub = datetime.fromisoformat(pub.replace("Z", "+00:00"))
            except ValueError:
                pub = None
        session.add(SocialPost(
            platform=c["platform"], external_id=c.get("external_id"),
            thumbnail_url=c.get("thumbnail_url"), text=c.get("text"),
            permalink=c["permalink"], published_at=pub,
        ))
    session.commit()
    print(f"[worker] caché de redes actualizada: {len(collected)} posts.")


def main():
    print("[worker] iniciando worker de El Malecón…")
    engine = None
    for _ in range(30):  # espera a que la DB esté lista
        try:
            engine = create_engine(DB_URL, pool_pre_ping=True)
            engine.connect().close()
            break
        except Exception:  # noqa: BLE001
            print("[worker] esperando a la base de datos…")
            time.sleep(3)
    if engine is None:
        raise SystemExit("[worker] no se pudo conectar a la base de datos")

    Session = sessionmaker(bind=engine)
    while True:
        session = Session()
        try:
            refresh(session)
        except Exception as exc:  # noqa: BLE001
            print(f"[worker] ciclo con error: {exc}")
        finally:
            session.close()
        time.sleep(REFRESH_SECONDS)


if __name__ == "__main__":
    main()
