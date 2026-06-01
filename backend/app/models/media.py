"""Metadatos de ficheros multimedia (alt text, SEO, link)."""
from sqlalchemy import Column, Integer, String, Text, DateTime, func

from app.core.database import Base


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True)
    path = Column(String, unique=True, nullable=False, index=True)  # relativo a MEDIA_ROOT
    alt_text = Column(String, nullable=True)
    link_url = Column(String, nullable=True)
    title = Column(String, nullable=True)
    seo_description = Column(Text, nullable=True)
    file_type = Column(String, nullable=True)   # image/video/pdf
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
