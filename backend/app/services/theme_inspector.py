"""
Genera un tema CSS a partir de la URL de un sitio web.
Proceso: fetch HTML → extrae CSS → Claude analiza estilos → devuelve CSS listo.
"""
import re
from urllib.parse import urljoin, urlparse

import httpx

from app.core.config import settings

_UA = "Mozilla/5.0 (compatible; MaleconStyleBot/1.0)"
_TIMEOUT = 12

# Formato exacto que debe seguir el tema generado
_THEME_TEMPLATE = """
:root {
  --bg:            ;  /* fondo principal */
  --surface:       ;  /* fondo de tarjetas/paneles */
  --surface-2:     ;  /* superficie secundaria */
  --border:        ;  /* color de bordes */
  --green:         ;  /* acento principal (puede no ser verde) */
  --green-hover:   ;  /* variante hover del acento */
  --amber:         ;  /* acento secundario cálido */
  --text:          ;  /* texto principal */
  --text-dim:      ;  /* texto atenuado */
  --glow:          ;  /* box-shadow de brillo (0 0 Xrem rgba(…)) */
  --radius:        ;  /* border-radius general */
  --font-head:     ;  /* fuente de headings */
  --font-body:     ;  /* fuente de cuerpo */
  --header-bg:     ;  /* fondo del header (con opacidad, ej: rgba(…, 0.9)) */
  --header-border: ;
  --hero-overlay:  ;  /* linear-gradient sobre el vídeo hero */
  --footer-bg:     ;
  --footer-border: ;
}
/* Overrides de componentes: body, .nav-link, .btn-primary, .btn-ghost,
   .card, .badge, input/select/textarea, .footer-col-title … */
"""


def _fetch(url: str) -> str:
    with httpx.Client(follow_redirects=True, timeout=_TIMEOUT,
                      headers={"User-Agent": _UA}) as c:
        r = c.get(url)
        r.raise_for_status()
        return r.text


def _extract_css(html: str, base_url: str) -> str:
    """Extrae CSS inline + hojas de estilo enlazadas (máx 3)."""
    # Bloques <style>
    inline = re.findall(r"<style[^>]*>(.*?)</style>", html, re.DOTALL | re.IGNORECASE)
    parts = [s.strip() for s in inline[:4] if s.strip()]

    # <link rel="stylesheet">
    hrefs = re.findall(
        r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    )
    hrefs += re.findall(
        r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']stylesheet["\']',
        html, re.IGNORECASE
    )

    with httpx.Client(follow_redirects=True, timeout=_TIMEOUT,
                      headers={"User-Agent": _UA}) as c:
        for href in hrefs[:3]:
            try:
                full = urljoin(base_url, href)
                if not full.startswith("http"):
                    continue
                r = c.get(full)
                ct = r.headers.get("content-type", "")
                if r.status_code == 200 and ("css" in ct or href.endswith(".css")):
                    parts.append(r.text[:25_000])
            except Exception:
                pass

    return "\n\n/* ─── */\n\n".join(parts)[:55_000]


def _meta_color(html: str) -> str:
    m = re.search(
        r'<meta[^>]+name=["\']theme-color["\'][^>]+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    )
    return m.group(1).strip() if m else ""


def _site_title(html: str) -> str:
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    return m.group(1).strip()[:80] if m else ""


def _sanitize_name(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    return name or "tema-generado"


def _next_prefix(themes_path) -> str:
    """Devuelve el siguiente número de orden (p.ej. '09-')."""
    existing = sorted(themes_path.glob("*.css"))
    nums = []
    for f in existing:
        m = re.match(r"^(\d+)-", f.name)
        if m:
            nums.append(int(m.group(1)))
    nxt = (max(nums) + 1) if nums else 9
    return f"{nxt:02d}-"


def _call_claude(url: str, title: str, meta_color: str, css: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    system = (
        "Eres un experto en diseño CSS. Tu tarea es analizar los estilos de un sitio web "
        "y generar un archivo CSS de tema para una escuela de baile latino llamada elMalecón. "
        "IMPORTANTE: responde ÚNICAMENTE con el CSS puro, sin explicaciones, "
        "sin bloques markdown, sin texto adicional."
    )

    user = f"""Analiza el sitio "{title}" ({url}).

Color meta: {meta_color or "(no indicado)"}

CSS extraído del sitio (puede estar truncado):
```
{css}
```

GENERA un tema CSS para elMalecón siguiendo EXACTAMENTE este formato:

{_THEME_TEMPLATE}

Reglas:
1. Extrae la paleta real del sitio (fondos, acentos, tipografía, efectos).
2. Adapta los colores para una web de baile latino — mantén la esencia visual pero asegura legibilidad.
3. Si hay Google Fonts identificables, añade @import al principio.
4. --green / --green-hover son el acento principal (puede ser cualquier color).
5. --glow debe ser un box-shadow con el color acento.
6. --hero-overlay: linear-gradient oscuro adaptado al tono del sitio.
7. --header-bg: usa rgba con ~0.90 de opacidad.
8. Añade overrides para .nav-link, .btn-primary, .btn-ghost, .card, .badge, input/select/textarea.
9. Para temas claros (--bg claro): .nav-link color oscuro, footer con fondo claro.
10. Cabecera de comentario: /* NOMBRE — inspirado en {url} */

Devuelve SOLO el CSS, sin markdown, sin explicaciones."""

    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": user}],
        system=system,
    )
    raw = resp.content[0].text.strip()
    # Limpia posibles bloques markdown
    raw = re.sub(r"^```(?:css)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```\s*$", "", raw, flags=re.MULTILINE)
    return raw.strip()


def generate_theme_from_url(url: str, user_name: str) -> dict:
    """
    Punto de entrada principal.
    Devuelve {"filename": str, "css": str, "saved": bool}.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY no está configurada.")

    html = _fetch(url)
    css = _extract_css(html, url)
    title = _site_title(html) or urlparse(url).netloc
    meta = _meta_color(html)

    generated_css = _call_claude(url, title, meta, css)

    # Guardar en backend/themes/
    safe_name = _sanitize_name(user_name)
    prefix = _next_prefix(settings.themes_path)
    filename = f"{prefix}{safe_name}.css"
    out_path = settings.themes_path / filename
    out_path.write_text(generated_css, encoding="utf-8")

    return {"filename": filename, "css": generated_css, "saved": True}
