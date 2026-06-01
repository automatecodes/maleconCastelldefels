"""Generación de imágenes con IA (admin) — §3.3."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.course import Course
from app.models.event import Event
from app.services import image_ai

router = APIRouter(prefix="/api/admin/images", tags=["admin:images"],
                   dependencies=[Depends(require_admin)])


class GenerateReq(BaseModel):
    prompt: str
    folder: str = "escuela"
    basename: str = "generada"
    color: str = "#2FE56B"
    title: str = ""


@router.get("/status")
def status():
    """Indica si hay proveedor de IA configurado o se usará placeholder."""
    provider = (settings.IMAGE_AI_PROVIDER or "").lower()
    configured = provider in ("openai", "stability") and bool(settings.IMAGE_AI_KEY)
    return {"provider": provider or "placeholder", "configured": configured}


@router.post("/generate")
def generate(req: GenerateReq):
    """Genera una imagen libre a partir de un prompt."""
    return image_ai.generate_image(
        req.prompt, req.folder, req.basename,
        size=settings.IMAGE_AI_SIZE, color=req.color, title=req.title,
    )


@router.post("/course/{course_id}")
def generate_course(course_id: int, db: Session = Depends(get_db)):
    """Genera la imagen del curso y la asigna a su `image_url`."""
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(404, "Curso no encontrado")
    prompt = image_ai.course_prompt(course.name, course.level, course.style, course.description)
    result = image_ai.generate_image(
        prompt, f"cursos/{course.slug}", "imagen",
        size=settings.IMAGE_AI_SIZE, color=course.calendar_color,
        title=f"{course.name} {course.level or ''}".strip(),
    )
    course.image_url = result["url"]
    db.commit()
    return result


@router.post("/event/{event_id}")
def generate_event(event_id: int, db: Session = Depends(get_db)):
    """Genera la imagen principal del evento y la asigna a su `image_url`."""
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Evento no encontrado")
    prompt = image_ai.event_prompt(event.name, event.description)
    result = image_ai.generate_image(
        prompt, f"eventos/{event.slug}", "principal",
        size=settings.IMAGE_AI_SIZE, title=event.name,
    )
    event.image_url = result["url"]
    db.commit()
    return result
