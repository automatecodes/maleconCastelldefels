"""Caché de últimas publicaciones de redes sociales (rellenada por el worker)."""
from sqlalchemy import Column, Integer, String, Text, DateTime, func

from app.core.database import Base


class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True)
    platform = Column(String, nullable=False)   # facebook/instagram/youtube/tiktok
    external_id = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    text = Column(Text, nullable=True)
    permalink = Column(String, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    cached_at = Column(DateTime(timezone=True), server_default=func.now())
