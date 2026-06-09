"""Selección de la hoja de estilos (tema) del sitio desde el admin.

Las hojas de estilo disponibles se leen en vivo de la carpeta de temas
(`settings.themes_path`, por defecto `frontend/src/styles`). El admin elige
cuál está activa; el resultado se persiste en `site_settings` y se sirve a la
web en `/api/public/theme.css` (proxied bajo /api en dev y prod, sin CORS).
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.setting import SiteSetting

ACTIVE_THEME_KEY = "active_theme"

router = APIRouter(prefix="/api/admin/themes", tags=["admin:themes"],
                   dependencies=[Depends(require_admin)])
public_router = APIRouter(prefix="/api/public", tags=["public:theme"])


CSS_VAR_PREFIX = "CSS_VAR_"
THEME_PREFIX = "THEME_"
THEME_HTML_SUFFIX = "_HTML"
THEME_SCRIPTS_SUFFIX = "_SCRIPTS"
THEME_LOGO_FILTER_SUFFIX = "_LOGO_FILTER"


class ThemeSelection(BaseModel):
    active: str = ""


class CssVars(BaseModel):
    vars: dict[str, str] = {}


class LogoFilterConfig(BaseModel):
    """Configuración de filtro CSS para el logo según tema."""
    hue_rotation: int = 0  # grados (0-360)
    saturation: float = 1.0  # 0.0-2.0
    brightness: float = 1.0  # 0.0-2.0
    drop_shadow_color: str = "#2FE56B"  # color sombra
    drop_shadow_blur: int = 8  # píxeles


class ThemeConfig(BaseModel):
    """Configuración completa de un tema."""
    name: str  # nombre/slug del tema
    css_variables: dict[str, str] = {}  # {--verde: "#2FE56B"}
    html_sections: dict[str, str] = {}  # {header: "<header>...", footer: "<footer>..."}
    scripts: str = ""  # código JavaScript personalizado
    logo_filter: LogoFilterConfig = LogoFilterConfig()
    metadata: dict[str, str] = {}  # datos adicionales


class ThemeFromURL(BaseModel):
    url: str
    name: str = "tema-generado"
    apply: bool = True   # aplicar automáticamente tras generar


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


@router.post("/from-url")
def theme_from_url(payload: ThemeFromURL, db: Session = Depends(get_db)):
    """Genera un tema CSS analizando la URL indicada con Claude."""
    from app.services.theme_inspector import generate_theme_from_url
    try:
        result = generate_theme_from_url(payload.url, payload.name)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(502, f"Error al inspeccionar la URL: {e}")

    if payload.apply:
        row = db.get(SiteSetting, ACTIVE_THEME_KEY)
        if row:
            row.value = result["filename"]
        else:
            db.add(SiteSetting(key=ACTIVE_THEME_KEY, value=result["filename"]))
        db.commit()

    return {
        "filename": result["filename"],
        "applied": payload.apply,
        "css_preview": result["css"][:500],
    }


@public_router.get("/theme")
def active_theme(db: Session = Depends(get_db)):
    return {"active": _get_active(db)}


@public_router.get("/theme-config")
def active_theme_config(db: Session = Depends(get_db)):
    """Devuelve la configuración del tema activo (incluyendo logo filter)."""
    active = _get_active(db)
    if not active:
        return {
            "active": "",
            "logo_filter": LogoFilterConfig().model_dump(),
            "html_sections": {},
            "scripts": ""
        }
    
    config = _get_theme_config(active, db)
    return {
        "active": active,
        "logo_filter": config.logo_filter.model_dump(),
        "html_sections": config.html_sections,
        "scripts": config.scripts,
        "css_variables": config.css_variables
    }


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


# ============ Temas Completos (con HTML, scripts, logo filter) ============

def _get_theme_config(theme_name: str, db: Session) -> ThemeConfig:
    """Lee toda la configuración de un tema desde SiteSetting."""
    prefix = f"{THEME_PREFIX}{theme_name}"
    
    # Leer variables CSS
    css_var_rows = db.query(SiteSetting).filter(
        SiteSetting.key.startswith(f"{prefix}_CSS_VAR_")
    ).all()
    css_vars = {r.key[len(f"{prefix}_CSS_VAR_"):]: r.value for r in css_var_rows}
    
    # Leer HTML sections
    html_row = db.get(SiteSetting, f"{prefix}{THEME_HTML_SUFFIX}")
    html_sections = json.loads(html_row.value) if html_row and html_row.value else {}
    
    # Leer scripts
    scripts_row = db.get(SiteSetting, f"{prefix}{THEME_SCRIPTS_SUFFIX}")
    scripts = scripts_row.value if scripts_row and scripts_row.value else ""
    
    # Leer logo filter
    logo_filter_row = db.get(SiteSetting, f"{prefix}{THEME_LOGO_FILTER_SUFFIX}")
    logo_filter = LogoFilterConfig()
    if logo_filter_row and logo_filter_row.value:
        try:
            logo_filter = LogoFilterConfig(**json.loads(logo_filter_row.value))
        except:
            pass
    
    # Metadatos generales
    metadata = {}
    
    return ThemeConfig(
        name=theme_name,
        css_variables=css_vars,
        html_sections=html_sections,
        scripts=scripts,
        logo_filter=logo_filter,
        metadata=metadata
    )


def _save_theme_config(config: ThemeConfig, db: Session):
    """Persiste toda la configuración de un tema en SiteSetting."""
    prefix = f"{THEME_PREFIX}{config.name}"
    
    # Guardar variables CSS
    for var_name, var_value in config.css_variables.items():
        key = f"{prefix}_CSS_VAR_{var_name.lstrip('-')}"
        row = db.get(SiteSetting, key)
        if row:
            row.value = var_value
        else:
            db.add(SiteSetting(key=key, value=var_value))
    
    # Guardar HTML sections
    if config.html_sections:
        html_key = f"{prefix}{THEME_HTML_SUFFIX}"
        row = db.get(SiteSetting, html_key)
        html_json = json.dumps(config.html_sections, ensure_ascii=False)
        if row:
            row.value = html_json
        else:
            db.add(SiteSetting(key=html_key, value=html_json))
    
    # Guardar scripts
    if config.scripts:
        scripts_key = f"{prefix}{THEME_SCRIPTS_SUFFIX}"
        row = db.get(SiteSetting, scripts_key)
        if row:
            row.value = config.scripts
        else:
            db.add(SiteSetting(key=scripts_key, value=config.scripts))
    
    # Guardar logo filter
    logo_filter_key = f"{prefix}{THEME_LOGO_FILTER_SUFFIX}"
    row = db.get(SiteSetting, logo_filter_key)
    logo_json = json.dumps(config.logo_filter.model_dump(), ensure_ascii=False)
    if row:
        row.value = logo_json
    else:
        db.add(SiteSetting(key=logo_filter_key, value=logo_json))
    
    db.commit()


@router.get("/config/{theme_name}")
def get_theme_config(theme_name: str, db: Session = Depends(get_db)):
    """Lee toda la configuración de un tema (CSS, HTML, scripts, logo filter)."""
    config = _get_theme_config(theme_name, db)
    return config.model_dump()


@router.put("/config/{theme_name}")
def save_theme_config(theme_name: str, config: ThemeConfig, db: Session = Depends(get_db)):
    """Guarda toda la configuración de un tema."""
    config.name = theme_name
    _save_theme_config(config, db)
    return {"saved": theme_name, "fields": len(config.css_variables) + len(config.html_sections) + bool(config.scripts)}


@router.get("/export-complete")
def export_complete_theme(db: Session = Depends(get_db)):
    """Exporta tema activo completo: CSS + HTML + scripts + logo filter."""
    active = _get_active(db)
    if not active:
        raise HTTPException(400, "No hay tema activo")
    
    config = _get_theme_config(active, db)
    return {
        "theme_name": active,
        "config": config.model_dump(),
        "timestamp": str(__import__("datetime").datetime.now())
    }


@router.post("/import-complete")
def import_complete_theme(data: dict, db: Session = Depends(get_db)):
    """Importa un tema completo desde JSON exportado."""
    try:
        theme_name = data.get("theme_name", "tema-importado")
        config_data = data.get("config", {})
        config = ThemeConfig(**config_data, name=theme_name)
        _save_theme_config(config, db)
        return {"imported": theme_name}
    except Exception as e:
        raise HTTPException(400, f"Error al importar tema: {str(e)}")
