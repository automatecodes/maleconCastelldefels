"""Mediateca (admin): subida, listado, borrado y metadatos de ficheros."""
import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.media import MediaFile

router = APIRouter(prefix="/api/admin/media", tags=["admin:media"],
                   dependencies=[Depends(require_admin)])

ALLOWED = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp4", ".webm", ".pdf"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
VIDEO_EXT = {".mp4", ".webm"}


def _safe_path(user_input: str) -> Path:
    """Resuelve user_input dentro de media_root y lanza 400 si escapa del directorio."""
    base = Path(settings.media_root).resolve()
    target = (base / user_input.strip("/")).resolve()
    if not str(target).startswith(str(base) + os.sep) and target != base:
        raise HTTPException(400, "Ruta no permitida")
    return target


def _file_type(ext: str) -> str:
    if ext in IMAGE_EXT:
        return "image"
    if ext in VIDEO_EXT:
        return "video"
    return "pdf"


class MetadataUpdate(BaseModel):
    path: str
    alt_text: str | None = None
    link_url: str | None = None
    title: str | None = None
    seo_description: str | None = None


@router.post("/upload")
def upload(folder: str = Form(...), file: UploadFile = File(...),
           db: Session = Depends(get_db)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(400, f"Extensión no permitida: {ext}")
    target_dir = _safe_path(folder)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / (file.filename or "upload")
    with open(target_path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    base = Path(settings.media_root).resolve()
    rel_path = str(target_path.relative_to(base))
    size = os.path.getsize(target_path)
    # Registrar en BD
    mf = db.query(MediaFile).filter_by(path=rel_path).first()
    if not mf:
        mf = MediaFile(path=rel_path)
        db.add(mf)
    mf.file_type = _file_type(ext)
    mf.size_bytes = size
    db.commit()
    return {"url": f"/media/{rel_path}", "path": rel_path}


@router.get("/list")
def list_media(folder: str = ""):
    target_dir = _safe_path(folder) if folder else Path(settings.media_root).resolve()
    safe_folder = folder.strip("/")
    if not target_dir.is_dir():
        return {"items": [], "folder": safe_folder}
    items = []
    for name in sorted(os.listdir(target_dir)):
        if name.startswith("."):
            continue
        full = target_dir / name
        is_dir = full.is_dir()
        rel = f"{safe_folder}/{name}" if safe_folder else name
        ext = os.path.splitext(name)[1].lower()
        items.append({
            "name": name,
            "path": rel,
            "url": f"/media/{rel}" if not is_dir else None,
            "type": "folder" if is_dir else _file_type(ext),
            "size": full.stat().st_size if not is_dir else None,
        })
    return {"items": items, "folder": safe_folder}


@router.delete("/delete")
def delete_file(path: str, db: Session = Depends(get_db)):
    full = _safe_path(path)
    if not full.exists():
        raise HTTPException(404, "Archivo no encontrado")
    if full.is_dir():
        raise HTTPException(400, "No se puede borrar carpetas desde aquí")
    full.unlink()
    safe_path = path.strip("/")
    mf = db.query(MediaFile).filter_by(path=safe_path).first()
    if mf:
        db.delete(mf)
        db.commit()
    return {"deleted": safe_path}


@router.get("/metadata")
def get_metadata(path: str, db: Session = Depends(get_db)):
    _safe_path(path)  # valida que la ruta no escapa de media_root
    safe_path = path.strip("/")
    mf = db.query(MediaFile).filter_by(path=safe_path).first()
    if not mf:
        return {"path": safe_path, "alt_text": None, "link_url": None,
                "title": None, "seo_description": None}
    return mf


@router.put("/metadata")
def update_metadata(payload: MetadataUpdate, db: Session = Depends(get_db)):
    _safe_path(payload.path)  # valida que la ruta no escapa de media_root
    safe_path = payload.path.strip("/")
    mf = db.query(MediaFile).filter_by(path=safe_path).first()
    if not mf:
        mf = MediaFile(path=safe_path)
        db.add(mf)
    mf.alt_text = payload.alt_text
    mf.link_url = payload.link_url
    mf.title = payload.title
    mf.seo_description = payload.seo_description
    db.commit()
    return mf
