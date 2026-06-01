"""Clase/Sesión semanal de un curso (para el calendario)."""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True)
    course_id = Column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    weekday = Column(Integer, nullable=False)   # 0=lunes ... 6=domingo
    start_time = Column(String, nullable=False)  # "19:00"
    end_time = Column(String, nullable=False)    # "20:00"
    room = Column(String, nullable=True)
    capacity = Column(Integer, default=0)

    course = relationship("Course", back_populates="sessions")
    teacher = relationship("Teacher")
