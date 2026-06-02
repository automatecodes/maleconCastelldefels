"""Schemas de cursos, profesores, sesiones y eventos (catálogo público + admin)."""
from datetime import date as date_type
from decimal import Decimal
from pydantic import BaseModel


# ---------- Referencia breve (para evitar circularidad) ----------
class CourseBrief(BaseModel):
    id: int
    slug: str
    name: str

    class Config:
        from_attributes = True


# ---------- Profesor ----------
class TeacherBase(BaseModel):
    slug: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    bio: str | None = None
    specialties: str | None = None
    photo_url:    str | None = None
    photo_focal:  str | None = "50% 50%"
    extra_images: str | None = None   # JSON array
    is_published: bool = True
    cv_pdf_url:   str | None = None
    video_url:    str | None = None
    availability: str | None = None
    internal_notes: str | None = None
    is_active: bool = True


class TeacherCreate(TeacherBase):
    pass


class TeacherOut(TeacherBase):
    id: int
    courses: list[CourseBrief] = []

    class Config:
        from_attributes = True


# ---------- Sesión ----------
class SessionBase(BaseModel):
    course_id: int
    teacher_id: int | None = None
    weekday: int
    start_time: str
    end_time: str
    room: str | None = None
    capacity: int = 0


class SessionCreate(SessionBase):
    pass


class SessionOut(SessionBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Curso ----------
class CourseBase(BaseModel):
    slug: str
    name: str
    level: str | None = None
    style: str | None = None
    description: str | None = None
    image_url:    str | None = None
    video_url:    str | None = None
    extra_images: str | None = None
    is_published: bool = True
    calendar_color: str = "#52C41A"
    room: str | None = None
    capacity: int = 0
    duration: str | None = None
    price: Decimal = Decimal("0")
    trial_price: Decimal = Decimal("0")
    status: str = "abierto"
    featured: bool = False


class CourseCreate(CourseBase):
    teacher_ids: list[int] = []


class CourseOut(CourseBase):
    id: int
    teachers: list[TeacherOut] = []
    sessions: list[SessionOut] = []
    enrolled_count: int = 0

    class Config:
        from_attributes = True


# ---------- Evento ----------
class EventPhotoOut(BaseModel):
    id: int
    url: str
    caption: str | None = None

    class Config:
        from_attributes = True


class EventBase(BaseModel):
    slug: str
    name: str
    subtitle: str | None = None
    description: str | None = None
    image_url:    str | None = None
    image_focal:  str | None = "50% 50%"
    video_url:    str | None = None
    extra_images: str | None = None
    is_published: bool = True
    date: date_type | None = None
    time_range: str | None = None
    location: str | None = None
    notes: str | None = None
    price: Decimal | None = None
    artists: str | None = None
    styles: str | None = None
    activities: str | None = None
    status: str = "proximo"


class EventCreate(EventBase):
    pass


class EventOut(EventBase):
    id: int
    photos: list[EventPhotoOut] = []
    computed_status: str | None = None   # próximo / histórico (calculado por fecha)

    class Config:
        from_attributes = True
