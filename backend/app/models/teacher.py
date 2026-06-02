"""Profesor."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    specialties = Column(String, nullable=True)  # CSV: "Salsa, Bachata"
    photo_url    = Column(String, nullable=True)
    photo_focal  = Column(String, nullable=True, default="50% 50%")
    extra_images = Column(Text, nullable=True)   # JSON array de URLs
    is_published = Column(Boolean, default=True, nullable=False)
    cv_pdf_url   = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    internal_notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Reservado para la fase de login (§11): vínculo a cuenta de usuario.
    account_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    courses = relationship(
        "Course", secondary="course_teachers", back_populates="teachers"
    )
