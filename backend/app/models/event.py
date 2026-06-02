"""Evento y sus fotos de galería."""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    image_url    = Column(String, nullable=True)
    image_focal  = Column(String, nullable=True, default="50% 50%")
    video_url    = Column(String, nullable=True)
    extra_images = Column(Text, nullable=True)   # JSON array de URLs
    is_published = Column(Boolean, default=True, nullable=False)
    date = Column(Date, nullable=True)
    time_range = Column(String, nullable=True)   # "11:00 – 23:00"
    location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)  # informativo
    artists = Column(String, nullable=True)
    styles = Column(String, nullable=True)
    activities = Column(Text, nullable=True)       # una por línea
    status = Column(String, default="proximo")     # proximo/pasado/publicado
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    photos = relationship("EventPhoto", back_populates="event", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="event", cascade="all, delete-orphan")


class EventPhoto(Base):
    __tablename__ = "event_photos"

    id = Column(Integer, primary_key=True)
    event_id = Column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    caption = Column(String, nullable=True)

    event = relationship("Event", back_populates="photos")
