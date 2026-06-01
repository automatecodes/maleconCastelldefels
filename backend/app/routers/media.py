"""Mediateca (admin): subida y listado de imágenes/vídeos."""
import os
import shutil

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin

router = APIRouter(prefix="/api/admin/media", tags=["admin:media"],
                   dependencies=[Depends(require_admin)])

ALLOWED = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".pdf"}


@router.post("/upload")
def upload(folder: str = Form(...), file: UploadFile = File(...),
           db: Session = Depends(get_db)):
    """Sube un fichero a /data/media/<folder>/. Devuelve la URL pública."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(400, f"Extensión no permitida: {ext}")
    safe_folder = folder.strip("/").replace("..", "")
    target_dir = os.path.join(settings.MEDIA_ROOT, safe_folder)
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, file.filename)
    with open(target_path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    return {"url": f"/media/{safe_folder}/{file.filename}"}


@router.get("/list")
def list_media(folder: str = ""):
    safe_folder = folder.strip("/").replace("..", "")
    target_dir = os.path.join(settings.MEDIA_ROOT, safe_folder)
    if not os.path.isdir(target_dir):
        return {"items": []}
    items = []
    for name in sorted(os.listdir(target_dir)):
        rel = f"{safe_folder}/{name}" if safe_folder else name
        items.append({"name": name, "url": f"/media/{rel}",
                      "is_dir": os.path.isdir(os.path.join(target_dir, name))})
    return {"items": items}
