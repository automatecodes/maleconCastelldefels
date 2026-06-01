"""Mediateca (admin): subida, listado, borrado y metadatos de ficheros."""
import os
import shutil

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
    safe_folder = folder.strip("/").replace("..", "")
    target_dir = os.path.join(settings.MEDIA_ROOT, safe_folder)
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, file.filename)
    with open(target_path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    rel_path = f"{safe_folder}/{file.filename}"
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
    safe_folder = folder.strip("/").replace("..", "")
    target_dir = os.path.join(settings.MEDIA_ROOT, safe_folder)
    if not os.path.isdir(target_dir):
        return {"items": [], "folder": safe_folder}
    items = []
    for name in sorted(os.listdir(target_dir)):
        if name.startswith("."):
            continue
        full = os.path.join(target_dir, name)
        is_dir = os.path.isdir(full)
        rel = f"{safe_folder}/{name}" if safe_folder else name
        ext = os.path.splitext(name)[1].lower()
        items.append({
            "name": name,
            "path": rel,
            "url": f"/media/{rel}" if not is_dir else None,
            "is_dir": is_dir,
            "size_bytes": os.path.getsize(full) if not is_dir else None,
            "file_type": _file_type(ext) if not is_dir else "folder",
        })
    return {"items": items, "folder": safe_folder}


@router.delete("/delete")
def delete_file(path: str, db: Session = Depends(get_db)):
    safe_path = path.strip("/").replace("..", "")
    full = os.path.join(settings.MEDIA_ROOT, safe_path)
    if not os.path.exists(full):
        raise HTTPException(404, "Archivo no encontrado")
    if os.path.isdir(full):
        raise HTTPException(400, "No se puede borrar carpetas desde aquí")
    os.remove(full)
    mf = db.query(MediaFile).filter_by(path=safe_path).first()
    if mf:
        db.delete(mf)
        db.commit()
    return {"deleted": safe_path}


@router.get("/metadata")
def get_metadata(path: str, db: Session = Depends(get_db)):
    safe_path = path.strip("/").replace("..", "")
    mf = db.query(MediaFile).filter_by(path=safe_path).first()
    if not mf:
        return {"path": safe_path, "alt_text": None, "link_url": None,
                "title": None, "seo_description": None}
    return mf


@router.put("/metadata")
def update_metadata(payload: MetadataUpdate, db: Session = Depends(get_db)):
    safe_path = payload.path.strip("/").replace("..", "")
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
