"""Inscripción: estudiante ↔ curso/evento. Reserva payment_status para §11."""
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True)
    student_id = Column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    event_id = Column(ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
    enroll_date = Column(Date, nullable=True)
    status = Column(String, default="activo")  # activo/prueba/baja/lista de espera

    # Reservado para la fase de pagos (§11)
    payment_status = Column(String, default="pendiente")
    price = Column(Numeric(10, 2), nullable=True)

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    event = relationship("Event", back_populates="enrollments")
