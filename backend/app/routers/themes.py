"""Selección de la hoja de estilos (tema) del sitio desde el admin.

Las hojas de estilo disponibles se leen en vivo de la carpeta de temas
(`settings.themes_path`, por defecto `frontend/src/styles`). El admin elige
cuál está activa; el resultado se persiste en `site_settings` y se sirve a la
web en `/api/public/theme.css` (proxied bajo /api en dev y prod, sin CORS).
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.setting import SiteSetting

ACTIVE_THEME_KEY = "active_theme"

router = APIRouter(prefix="/api/admin/themes", tags=["admin:themes"],
                   dependencies=[Depends(require_admin)])
public_router = APIRouter(prefix="/api/public", tags=["public:theme"])


class ThemeSelection(BaseModel):
    active: str = ""


def _list_css_files() -> list[str]:
    base = settings.themes_path
    if not base.is_dir():
        return []
    return sorted(p.name for p in base.glob("*.css") if p.is_file())


def _get_active(db: Session) -> str:
    row = db.get(SiteSetting, ACTIVE_THEME_KEY)
    return row.value if row and row.value else ""


@router.get("")
def list_themes(db: Session = Depends(get_db)):
    """Hojas de estilo disponibles en la carpeta y cuál está activa."""
    return {"themes": _list_css_files(), "active": _get_active(db)}


@router.put("")
def set_active_theme(payload: ThemeSelection, db: Session = Depends(get_db)):
    """Fija la hoja de estilos activa (cadena vacía = ninguna / estilos base)."""
    name = payload.active.strip()
    if name and name not in _list_css_files():
        raise HTTPException(404, "Hoja de estilos no encontrada")
    row = db.get(SiteSetting, ACTIVE_THEME_KEY)
    if row:
        row.value = name
    else:
        db.add(SiteSetting(key=ACTIVE_THEME_KEY, value=name))
    db.commit()
    return {"active": name}


@public_router.get("/theme")
def active_theme(db: Session = Depends(get_db)):
    return {"active": _get_active(db)}


@public_router.get("/theme.css")
def active_theme_css(db: Session = Depends(get_db)):
    """Devuelve el contenido del CSS activo (vacío si no hay ninguno)."""
    name = _get_active(db)
    css = ""
    if name and name in _list_css_files():  # valida y evita path traversal
        css = (settings.themes_path / name).read_text(encoding="utf-8")
    return Response(content=css, media_type="text/css")
