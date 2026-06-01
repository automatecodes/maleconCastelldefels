"""Endpoints públicos consumidos por la web (sin autenticación)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.course import Course
from app.models.teacher import Teacher
from app.models.event import Event
from app.models.session import ClassSession
from app.models.social import SocialPost
from app.models.lead import Lead
from app.models.consent import ConsentLog
from app.schemas.catalog import CourseOut, TeacherOut, EventOut, SessionOut
from app.schemas.crm import LeadCreate
from app.schemas.social import SocialPostOut
from app.services.email import send_email

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/config")
def public_config():
    """Configuración pública (no sensible) para el frontend."""
    return {
        "app_name": settings.APP_NAME,
        "domain": settings.DOMAIN,
        "whatsapp_number": settings.WHATSAPP_NUMBER,
    }


@router.get("/courses", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.featured.desc(), Course.name).all()


@router.get("/courses/{slug}", response_model=CourseOut)
def get_course(slug: str, db: Session = Depends(get_db)):
    return db.query(Course).filter(Course.slug == slug).first()


@router.get("/teachers", response_model=list[TeacherOut])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).filter(Teacher.is_active == True).all()  # noqa: E712


@router.get("/teachers/{slug}", response_model=TeacherOut)
def get_teacher(slug: str, db: Session = Depends(get_db)):
    return db.query(Teacher).filter(Teacher.slug == slug).first()


@router.get("/schedule", response_model=list[SessionOut])
def schedule(db: Session = Depends(get_db)):
    """Todas las sesiones semanales para el calendario."""
    return db.query(ClassSession).all()


@router.get("/events", response_model=list[EventOut])
def list_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.date.desc()).all()


@router.get("/events/{slug}", response_model=EventOut)
def get_event(slug: str, db: Session = Depends(get_db)):
    return db.query(Event).filter(Event.slug == slug).first()


@router.get("/social", response_model=list[SocialPostOut])
def social_feed(db: Session = Depends(get_db)):
    return (
        db.query(SocialPost)
        .order_by(SocialPost.published_at.desc())
        .limit(24)
        .all()
    )


@router.post("/contact", status_code=201)
def submit_contact(payload: LeadCreate, request: Request, db: Session = Depends(get_db)):
    """Crea un Lead en el CRM y notifica por email a la escuela."""
    lead = Lead(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        level=payload.level,
        course_interest_id=payload.course_interest_id,
        message=payload.message,
        preferred_channel=payload.preferred_channel,
        source=payload.source,
        consent="si" if payload.consent else "no",
    )
    db.add(lead)

    db.add(ConsentLog(
        subject=payload.email or payload.phone,
        kind="formulario",
        detail="Consentimiento RGPD del formulario de contacto",
        ip=request.client.host if request.client else None,
    ))
    db.commit()
    db.refresh(lead)

    send_email(
        subject=f"Nuevo lead web — {lead.name}",
        body=(
            f"Nombre: {lead.name}\nEmail: {lead.email}\nTeléfono: {lead.phone}\n"
            f"Nivel: {lead.level}\nMensaje:\n{lead.message}"
        ),
    )
    return {"ok": True, "lead_id": lead.id}


@router.post("/track/whatsapp", status_code=204)
def track_whatsapp_click(db: Session = Depends(get_db)):
    """Registra un clic de WhatsApp como lead para estadísticas de conversión."""
    db.add(Lead(
        name="(clic WhatsApp)",
        preferred_channel="whatsapp",
        source="whatsapp",
        status="nuevo",
    ))
    db.commit()
    return
