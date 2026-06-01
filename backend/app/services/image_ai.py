"""Generación automática de imágenes (IA) — módulo pluggable (§3.3 / §6).

Proveedor configurable por `.env`:
  IMAGE_AI_PROVIDER = openai | stability | (vacío → placeholder local)
  IMAGE_AI_KEY      = clave del proveedor
  IMAGE_AI_MODEL    = (opcional) modelo del proveedor

Sin clave válida, genera un placeholder SVG con la marca (verde neón sobre fondo
oscuro) para no bloquear la etapa inicial. Todas las imágenes se guardan en
/data/media/<folder>/ y la función devuelve la URL pública (/media/...).
"""
import base64
import html
import os

import httpx

from app.core.config import settings

MEDIA_ROOT = settings.MEDIA_ROOT


class ImageAIError(Exception):
    pass


def _save_bytes(folder: str, basename: str, ext: str, data: bytes) -> str:
    safe_folder = folder.strip("/").replace("..", "")
    target_dir = os.path.join(MEDIA_ROOT, safe_folder)
    os.makedirs(target_dir, exist_ok=True)
    filename = f"{basename}.{ext}"
    with open(os.path.join(target_dir, filename), "wb") as fh:
        fh.write(data)
    return f"/media/{safe_folder}/{filename}"


# --------------------------------------------------------------------------- #
#  Proveedores
# --------------------------------------------------------------------------- #
def _openai(prompt: str, size: str) -> tuple[bytes, str]:
    model = settings.IMAGE_AI_MODEL or "gpt-image-1"
    resp = httpx.post(
        "https://api.openai.com/v1/images/generations",
        headers={"Authorization": f"Bearer {settings.IMAGE_AI_KEY}"},
        json={"model": model, "prompt": prompt, "size": size, "n": 1},
        timeout=120,
    )
    if resp.status_code >= 400:
        raise ImageAIError(f"OpenAI {resp.status_code}: {resp.text[:300]}")
    item = resp.json()["data"][0]
    if item.get("b64_json"):
        return base64.b64decode(item["b64_json"]), "png"
    # dall-e-3 puede devolver URL
    img = httpx.get(item["url"], timeout=120)
    return img.content, "png"


def _stability(prompt: str, size: str) -> tuple[bytes, str]:
    model = settings.IMAGE_AI_MODEL or "core"
    resp = httpx.post(
        f"https://api.stability.ai/v2beta/stable-image/generate/{model}",
        headers={"Authorization": f"Bearer {settings.IMAGE_AI_KEY}", "Accept": "image/*"},
        files={"none": ""},
        data={"prompt": prompt, "output_format": "png"},
        timeout=120,
    )
    if resp.status_code >= 400:
        raise ImageAIError(f"Stability {resp.status_code}: {resp.text[:300]}")
    return resp.content, "png"


def _placeholder(prompt: str, color: str, title: str) -> tuple[bytes, str]:
    """Genera un placeholder SVG con la estética de marca (sin coste, offline)."""
    label = html.escape((title or prompt or "El Malecón").strip())[:42]
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='640' viewBox='0 0 1024 640'>
  <defs>
    <radialGradient id='g' cx='30%' cy='30%' r='80%'>
      <stop offset='0%' stop-color='{color}' stop-opacity='0.35'/>
      <stop offset='55%' stop-color='#121814' stop-opacity='1'/>
      <stop offset='100%' stop-color='#0A0E0B' stop-opacity='1'/>
    </radialGradient>
  </defs>
  <rect width='1024' height='640' fill='url(#g)'/>
  <circle cx='820' cy='480' r='180' fill='{color}' opacity='0.12'/>
  <text x='512' y='300' font-family='Space Grotesk, Arial, sans-serif' font-size='58'
        font-weight='700' fill='#F4F7F4' text-anchor='middle'>{label}</text>
  <text x='512' y='370' font-family='Inter, Arial, sans-serif' font-size='26'
        fill='{color}' text-anchor='middle' letter-spacing='3'>EL MALECÓN DE LA SALSA</text>
  <text x='512' y='600' font-family='Inter, Arial, sans-serif' font-size='16'
        fill='#9AA39C' text-anchor='middle'>imagen IA pendiente · etapa inicial</text>
</svg>"""
    return svg.encode("utf-8"), "svg"


# --------------------------------------------------------------------------- #
#  API pública del módulo
# --------------------------------------------------------------------------- #
def generate_image(prompt: str, folder: str, basename: str, *,
                   size: str = "1024x1024", color: str = "#2FE56B",
                   title: str = "") -> dict:
    """Genera y guarda una imagen. Devuelve {url, provider, fallback}."""
    provider = (settings.IMAGE_AI_PROVIDER or "").lower()
    fallback = False
    try:
        if provider == "openai" and settings.IMAGE_AI_KEY:
            data, ext = _openai(prompt, size)
        elif provider == "stability" and settings.IMAGE_AI_KEY:
            data, ext = _stability(prompt, size)
        else:
            data, ext = _placeholder(prompt, color, title)
            fallback = True
    except ImageAIError as exc:
        # Ante cualquier fallo del proveedor, no romper: caer al placeholder.
        print(f"[image_ai] {exc} → usando placeholder")
        data, ext = _placeholder(prompt, color, title)
        fallback = True

    url = _save_bytes(folder, basename, ext, data)
    return {"url": url, "provider": provider or "placeholder", "fallback": fallback}


def course_prompt(name: str, level: str | None, style: str | None, description: str | None) -> str:
    return (
        f"Fotografía vibrante y profesional de una clase de baile de {style or name} "
        f"({name} {level or ''}) en una escuela de baile latino. Ambiente de club con "
        f"luces verde neón, gente bailando con energía, estética moderna y cálida, "
        f"alta calidad. {description or ''}"
    ).strip()


def event_prompt(name: str, description: str | None) -> str:
    return (
        f"Cartel/fotografía atractiva para el evento de baile latino '{name}'. "
        f"Fiesta de salsa y bachata, ambiente festivo junto al mar, luces verde neón, "
        f"energía latina. {description or ''}"
    ).strip()
