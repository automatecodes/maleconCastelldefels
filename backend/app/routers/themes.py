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


CSS_VAR_PREFIX = "CSS_VAR_"


class ThemeSelection(BaseModel):
    active: str = ""


class CssVars(BaseModel):
    vars: dict[str, str] = {}


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


@router.get("/variables")
def get_css_vars(db: Session = Depends(get_db)):
    """Devuelve las variables CSS personalizadas guardadas en site_settings."""
    rows = db.query(SiteSetting).filter(
        SiteSetting.key.startswith(CSS_VAR_PREFIX)
    ).all()
    return {"vars": {r.key[len(CSS_VAR_PREFIX):]: r.value for r in rows}}


@router.put("/variables")
def set_css_vars(payload: CssVars, db: Session = Depends(get_db)):
    """Guarda variables CSS personalizadas en site_settings."""
    for name, value in payload.vars.items():
        key = f"{CSS_VAR_PREFIX}{name}"
        row = db.get(SiteSetting, key)
        if row:
            row.value = value
        else:
            db.add(SiteSetting(key=key, value=value))
    db.commit()
    return {"saved": len(payload.vars)}


@router.get("/export")
def export_theme(db: Session = Depends(get_db)):
    """Exporta todas las variables del tema activo + personalizaciones."""
    import re
    name = _get_active(db)
    base_vars: dict[str, str] = {}
    if name and name in _list_css_files():
        css = (settings.themes_path / name).read_text(encoding="utf-8")
        for m in re.finditer(r"--([\w-]+)\s*:\s*([^;]+);", css):
            base_vars[f"--{m.group(1)}"] = m.group(2).strip()
    # Sobreescribir con personalizaciones guardadas
    rows = db.query(SiteSetting).filter(
        SiteSetting.key.startswith(CSS_VAR_PREFIX)
    ).all()
    for r in rows:
        base_vars[f"--{r.key[len(CSS_VAR_PREFIX):]}"] = r.value
    from fastapi.responses import JSONResponse
    return JSONResponse({"theme": name, "vars": base_vars})


@router.post("/import")
def import_theme(payload: CssVars, db: Session = Depends(get_db)):
    """Importa variables CSS desde JSON y las persiste."""
    for name, value in payload.vars.items():
        # Acepta tanto '--green' como 'green'
        clean = name.lstrip("-")
        key = f"{CSS_VAR_PREFIX}{clean}"
        row = db.get(SiteSetting, key)
        if row:
            row.value = value
        else:
            db.add(SiteSetting(key=key, value=value))
    db.commit()
    return {"imported": len(payload.vars)}


@public_router.get("/theme")
def active_theme(db: Session = Depends(get_db)):
    return {"active": _get_active(db)}


@public_router.get("/theme.css")
def active_theme_css(db: Session = Depends(get_db)):
    """CSS activo + variables personalizadas inyectadas en :root."""
    name = _get_active(db)
    css = ""
    if name and name in _list_css_files():
        css = (settings.themes_path / name).read_text(encoding="utf-8")
    # Inyectar personalizaciones
    rows = db.query(SiteSetting).filter(
        SiteSetting.key.startswith(CSS_VAR_PREFIX)
    ).all()
    if rows:
        overrides = "\n".join(
            f"  --{r.key[len(CSS_VAR_PREFIX):]}: {r.value};" for r in rows
        )
        css = f":root {{\n{overrides}\n}}\n" + css
    return Response(content=css, media_type="text/css")
