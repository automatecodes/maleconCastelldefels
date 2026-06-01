"""Curso y tabla de asociación curso-profesor."""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Numeric, Table, ForeignKey, func
)
from sqlalchemy.orm import relationship

from app.core.database import Base

course_teachers = Table(
    "course_teachers",
    Base.metadata,
    Column("course_id", ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("teacher_id", ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True),
)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    level = Column(String, nullable=True)          # N1, N2, Único...
    style = Column(String, nullable=True)          # categoría/estilo
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    calendar_color = Column(String, default="#2FE56B", nullable=False)
    room = Column(String, nullable=True)
    capacity = Column(Integer, default=0)
    duration = Column(String, nullable=True)       # "10 sem · 1h/sem"
    price = Column(Numeric(10, 2), default=0)
    trial_price = Column(Numeric(10, 2), default=0)
    status = Column(String, default="abierto")     # abierto/cerrado/lista de espera
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teachers = relationship(
        "Teacher", secondary=course_teachers, back_populates="courses"
    )
    sessions = relationship("ClassSession", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")

    @property
    def enrolled_count(self) -> int:
        return len([e for e in self.enrollments if e.status in ("activo", "prueba")])
