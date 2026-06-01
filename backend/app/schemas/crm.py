"""Schemas de CRM: estudiantes, inscripciones y leads."""
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr


# ---------- Estudiante ----------
class StudentBase(BaseModel):
    first_name: str
    last_name: str | None = None
    birth_date: date | None = None
    document: str | None = None
    photo_url: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    postal_code: str | None = None
    current_level: str | None = None
    enroll_date: date | None = None
    status: str = "lead"
    lead_source: str | None = None
    notes: str | None = None
    tags: str | None = None
    guardian_name: str | None = None
    guardian_contact: str | None = None


class StudentCreate(StudentBase):
    pass


class StudentOut(StudentBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Inscripción ----------
class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int | None = None
    event_id: int | None = None
    enroll_date: date | None = None
    status: str = "activo"
    payment_status: str = "pendiente"
    price: Decimal | None = None


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentOut(EnrollmentBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Lead / Contacto ----------
class LeadCreate(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    level: str | None = None
    course_interest_id: int | None = None
    message: str | None = None
    preferred_channel: str = "whatsapp"
    source: str = "web"
    consent: bool = False


class LeadUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


class LeadOut(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    level: str | None = None
    course_interest_id: int | None = None
    message: str | None = None
    preferred_channel: str
    status: str
    source: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True
