"""Genera imágenes (IA o placeholder) para cursos y eventos que no tengan una real.

Uso:
  python -m app.generate_images            # solo faltantes
  python -m app.generate_images --force    # regenera todas
"""
import os
import sys

from app.core.config import settings
from app.core.database import SessionLocal
import app.models  # noqa: F401
from app.models.course import Course
from app.models.event import Event
from app.services import image_ai


def _exists(url: str | None) -> bool:
    if not url or not url.startswith("/media/"):
        return False
    return os.path.isfile(os.path.join(settings.MEDIA_ROOT, url[len("/media/"):]))


def run(force: bool = False):
    db = SessionLocal()
    try:
        for c in db.query(Course).all():
            if not force and _exists(c.image_url):
                continue
            prompt = image_ai.course_prompt(c.name, c.level, c.style, c.description)
            res = image_ai.generate_image(
                prompt, f"cursos/{c.slug}", "imagen",
                size=settings.IMAGE_AI_SIZE, color=c.calendar_color,
                title=f"{c.name} {c.level or ''}".strip(),
            )
            c.image_url = res["url"]
            print(f"  curso {c.slug}: {res['url']} ({res['provider']})")

        for e in db.query(Event).all():
            if not force and _exists(e.image_url):
                continue
            prompt = image_ai.event_prompt(e.name, e.description)
            res = image_ai.generate_image(
                prompt, f"eventos/{e.slug}", "principal",
                size=settings.IMAGE_AI_SIZE, title=e.name,
            )
            e.image_url = res["url"]
            print(f"  evento {e.slug}: {res['url']} ({res['provider']})")

        db.commit()
        print("Generación de imágenes completada.")
    finally:
        db.close()


if __name__ == "__main__":
    run(force="--force" in sys.argv)
