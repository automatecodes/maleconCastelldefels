# El Malecón de la Salsa — elmaleconcastelldefels.com

Web pública multi-idioma (ES/CA/EN) + backend de administración con CRM, calendario
visual, panel de estadísticas, galerías, feed de redes y formulario de contacto con
énfasis en WhatsApp. Construida según `PROMPT_malecon.md`.

> **Estética:** verde neón "glow" sobre fondos oscuros, energía de club latino.
> El **logo lo sube el cliente** (ver más abajo).

---

## 🧱 Stack

| Servicio   | Tecnología                          |
|------------|-------------------------------------|
| `api`      | Python · FastAPI · SQLAlchemy       |
| `db`       | PostgreSQL 16                       |
| `worker`   | Python (caché de redes sociales)    |
| `frontend` | React + Vite (SPA) · i18n · Recharts |

Arquitectura **modular y extensible**: el modelo de datos ya reserva el camino para
**login, autorregistro de estudiantes y pagos** (ver §11 del prompt) sin reescritura.

---

## 🚀 Puesta en marcha

### 1. Configurar el entorno
```bash
cp .env.example .env
# Edita .env: JWT_SECRET, contraseñas de DB, ADMIN_PASSWORD, SMTP y (opcional) tokens.
```

### 2. Desarrollo local (con Docker)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```
- Web:   http://localhost:8080
- API:   http://localhost:8000/docs  (Swagger)
- Admin: http://localhost:8080/admin

La API crea las tablas y ejecuta el **seed** automáticamente al arrancar.

### 3. Desarrollo del frontend sin Docker (hot reload)
```bash
# Terminal 1 — backend
cd backend
python -m venv .venv && . .venv/Scripts/activate   # Windows
pip install -r requirements.txt
python -m app.seed          # crea tablas + datos semilla (requiere PostgreSQL local)
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxy /api y /media → :8000)
```

### 4. Producción (detrás de nginx-proxy + acme-companion)
La red externa `proxyNet` y el reverse proxy con SSL deben existir previamente:
```bash
docker network create proxyNet   # si no existe
docker compose up --build -d
```
El servicio `frontend` se publica con `VIRTUAL_HOST`/`LETSENCRYPT_HOST` =
`elmaleconcastelldefels.com`. **No se exponen puertos al host.**

---

## 🔑 Acceso al admin

Credenciales iniciales (de `.env`, cámbialas):
```
Email:       ADMIN_EMAIL      (def. admin@elmaleconcastelldefels.com)
Contraseña:  ADMIN_PASSWORD   (def. malecon2026)
```
Incluye: panel de **estadísticas**, CRM de **estudiantes**, **profesores**, **cursos**,
**eventos** y **bandeja de Leads** (con conversión Lead → Estudiante).

---

## 🖼️ Logo y media

1. **Logo:** coloca `logo.png` en `frontend/public/` (cabecera + favicon). Sin él, el
   header muestra el texto «elMalecón» como respaldo. Recomendado además `logo-og.png`
   (1200×630) para Open Graph.
2. **Media** (imágenes, vídeos, CV en PDF) se organiza en `data/media/` siguiendo:
   ```
   data/media/
     escuela/                   (hero.mp4, instalación*.jpg, institucional.mp4, logo)
     cursos/<slug>/             (imagen.jpg, video del curso)
     profesores/<slug>/         (foto.jpg, cv.pdf, video)
     eventos/<slug>/            (principal.jpg + galeria/)
   ```
   Súbela también desde **Admin → Mediateca** (endpoint `/api/admin/media/upload`).

> En la etapa inicial las imágenes de cursos/web pueden **generarse con IA**
> (`IMAGE_AI_PROVIDER`/`IMAGE_AI_KEY`). Los `image_url` del seed apuntan a las rutas
> esperadas; basta con colocar los ficheros ahí.

---

## 🌱 Datos semilla (§5)

Al sembrar se crean: **5 cursos**, **5 profesores**, **10 estudiantes** (con estados y
orígenes variados para poblar las estadísticas), varios **leads** y el evento
**Guarachando Summer 2026** con galería. Todo es **editable** desde el admin.

Re-sembrar manualmente:
```bash
docker compose exec api python -m app.seed
```

---

## 🎨 Generación de imágenes con IA (§3.3)

Módulo **pluggable** por `.env`. Soporta tres proveedores:

| Proveedor   | Variable clave      | Resultado | Notas                                            |
|-------------|---------------------|-----------|--------------------------------------------------|
| `claude`    | `ANTHROPIC_API_KEY` | SVG       | **Recomendado** — arte vectorial de alta calidad |
| `openai`    | `IMAGE_AI_KEY`      | PNG       | Usa gpt-image-1 o DALL-E                         |
| `stability` | `IMAGE_AI_KEY`      | PNG       | Stable Diffusion Core                            |
| *(vacío)*   | —                   | SVG       | Placeholder de marca offline                     |

### Configuración recomendada (Claude)

```env
IMAGE_AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
IMAGE_AI_MODEL=claude-haiku-4-5-20251001   # opcional, usa haiku por defecto
```
> Claude no genera imágenes raster (PNG/JPEG) pero produce SVG artísticos de alta
> calidad con gradientes, sombras y la estética de marca del Malecón. Para imágenes
> fotorrealistas usa OpenAI o Stability AI.

Formas de usar:
- **Admin** → en *Cursos* y *Eventos*, botón **✨** en cada fila (genera y asigna la imagen).
- **API**: `POST /api/admin/images/course/{id}`, `/event/{id}` o `/generate` (prompt libre).
- **Bulk / arranque**: el seed genera imágenes para todos los cursos y el evento. Manual:
  ```bash
  docker compose exec api python -m app.generate_images          # solo faltantes
  docker compose exec api python -m app.generate_images --force  # regenerar todas
  ```

## 🔌 Conectores de redes

El `worker` refresca la caché de publicaciones (Instagram/YouTube; FB/TikTok preparados)
cada `SOCIAL_REFRESH_SECONDS`. **Sin tokens válidos** se mantienen *placeholders* y se
reintenta en cada ciclo. Añade `IG_TOKEN`, `YOUTUBE_API_KEY`, etc. en `.env`.

---

## 📋 PENDIENTE al construir (§12)
- [ ] Logo definitivo y ajustes finos de marca.
- [ ] Tokens oficiales FB/IG/YouTube/TikTok.
- [ ] Cuenta Gmail + contraseña de aplicación (o SMTP alternativo).
- [ ] Proveedor de generación de imágenes IA.
- [ ] Datos legales del titular (razón social, NIF, domicilio, email) en los textos del
      Anexo A (`frontend/src/pages/Legal.jsx`) + revisión jurídica y traducción CA/EN.
- [ ] Confirmar cursos, niveles y profesores definitivos.

## 🔭 Fases futuras (§11) — el camino ya está hecho
- **Login/cuentas:** tabla `users` con roles; `account_id` en estudiante/profesor.
- **Autorregistro:** flujo Lead→Estudiante listo; solo falta exponer endpoint + vista.
- **Pagos:** entidad `Enrollment` con `payment_status`/`price`; activar módulo de
  pasarela pluggable vía `PAYMENT_PROVIDER` y el bloque «Ingresos» del panel.

---

## ✅ Cumplimiento
- **RGPD:** banner de cookies, consentimiento explícito en el formulario, registro de
  consentimientos (`consent_logs`), textos legales (Anexo A).
- **SEO:** metaetiquetas, Open Graph, hreflang, `sitemap.xml`, `robots.txt`, schema.org
  (DanceSchool). Preparado para Google Tag Manager / Analytics y seguimiento de
  conversión (formulario y clic de WhatsApp).
