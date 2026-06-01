"""Estudiante (CRM)."""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)

    # Identificación
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    document = Column(String, nullable=True)     # DNI/NIE (opcional)
    photo_url = Column(String, nullable=True)

    # Contacto
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)

    # Académico
    current_level = Column(String, nullable=True)
    enroll_date = Column(Date, nullable=True)
    contact_date = Column(Date, nullable=True)       # fecha primer contacto
    # inscrito / interesado / graduado / baja
    status = Column(String, default="interesado", nullable=False)

    # Captación
    lead_source = Column(String, nullable=True)  # web/whatsapp/redes/escuela/contactos

    # Seguimiento
    notes = Column(Text, nullable=True)
    tags = Column(String, nullable=True)         # CSV

    # Menores: tutor legal
    guardian_name = Column(String, nullable=True)
    guardian_contact = Column(String, nullable=True)

    # RGPD
    consent_given = Column(String, nullable=True)
    consent_date = Column(DateTime(timezone=True), nullable=True)

    # Reservado para fases futuras (§11)
    account_id = Column(Integer, nullable=True)
    situacion_pago = Column(String, nullable=True)
    bono = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
