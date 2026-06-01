# El Malecón de Castelldefels — Contexto del proyecto

## Qué es este proyecto

Web completa para una **escuela de baile latino** en Castelldefels (Barcelona).
Dominio: `elmaleconcastelldefels.com`. Estética: verde neón (#2FE56B) sobre fondos oscuros (#0A0E0B), energía de club latino.

## Stack

| Servicio     | Tecnología                              | Puerto local |
|------------- |-----------------------------------------|-------------|
| `api`        | Python 3.12 · FastAPI · SQLAlchemy ORM  | 8000        |
| `db`         | PostgreSQL 16 (volumen `data/db/`)      | 5432        |
| `worker`     | Python · caché de redes sociales        | —           |
| `frontend`   | React 18 + Vite · i18n (ES/CA/EN)       | 5173 / 8080 |
| Proxy (prod) | nginx + acme-companion (SSL automático) | 80/443      |

## Estructura clave

```
backend/app/
  core/         → config.py (Settings), database.py, deps.py, security.py (JWT)
  models/       → SQLAlchemy ORM: Course, Event, Student, Teacher, Lead, User…
  routers/      → FastAPI routers por dominio (auth, courses, events, students…)
  schemas/      → Pydantic v2: catalog.py, crm.py, social.py, auth.py
  services/     → email.py (SMTP), image_ai.py (generación de imágenes con IA)
  seed.py       → Crea tablas + datos semilla al arrancar (5 cursos, 5 profesores…)
  generate_images.py → Genera imágenes para todos los cursos/eventos

frontend/src/
  pages/        → Home, Courses, Events, School, Schedule, Contact, Legal
  pages/admin/  → Dashboard, CoursesAdmin, EventsAdmin, StudentsAdmin, TeachersAdmin…
  components/   → Header, Footer, CourseCard, Carousel, WhatsAppButton, SocialFeed…
  i18n/         → es.json, ca.json, en.json  (strings multiidioma)
  styles/       → theme.css, layout.css, el-malecon-styles.css, admin.css
  media/        → Assets multimedia estáticos (videos para el hero, etc.)
  api/client.js → Funciones fetch hacia /api/*

worker/worker.py → Refresca caché de publicaciones sociales cada SOCIAL_REFRESH_SECONDS
```

## Desarrollo rápido

```bash
# Arrancar todo con Docker (recomendado)
docker compose -f docker-compose.yml -f dev.yml up --build

# Solo frontend con hot reload
cd frontend && npm install && npm run dev   # proxy /api y /media → :8000

# Solo backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload              # crea tablas + seed al arrancar
```

## Variables de entorno clave (`.env`)

| Variable               | Uso                                             |
|------------------------|-------------------------------------------------|
| `JWT_SECRET`           | Firmar tokens JWT — cambiar en producción       |
| `ADMIN_EMAIL/PASSWORD` | Credenciales del primer admin (creadas por seed)|
| `POSTGRES_*`           | Conexión a la base de datos                     |
| `SMTP_*`               | Envío de email (Gmail con App Password)         |
| `WHATSAPP_NUMBER`      | Número de WhatsApp para botón flotante          |
| `IMAGE_AI_PROVIDER`    | `claude` \| `openai` \| `stability` \| vacío    |
| `IMAGE_AI_KEY`         | Clave del proveedor de imágenes (o ANTHROPIC_API_KEY)|
| `ANTHROPIC_API_KEY`    | API key de Anthropic (para proveedor `claude`)  |
| `IG_TOKEN/YOUTUBE_*`   | Tokens de redes sociales (vacío = placeholders) |

## Generación de imágenes con IA

El módulo `backend/app/services/image_ai.py` es pluggable:
- **`claude`** → Genera SVG de alta calidad usando Claude API (recomendado)
- **`openai`** → Genera PNG/JPEG usando gpt-image-1 o DALL-E
- **`stability`** → Genera PNG con Stable Diffusion
- **vacío** → Placeholder SVG offline con la estética de marca (funciona siempre)

Actívalo en `.env`:
```
IMAGE_AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
IMAGE_AI_MODEL=claude-haiku-4-5-20251001   # opcional
```

## Flujo del admin

1. Login en `/admin` → JWT guardado en localStorage
2. **Dashboard** → estadísticas (estudiantes, ingresos, conversiones)
3. **CRM** → Leads, Estudiantes, Profesores con conversión Lead→Estudiante
4. **Catálogo** → Cursos y Eventos con upload de imágenes y botón ✨ (generar con IA)
5. **Apariencia** → Temas CSS seleccionables desde el panel

## Datos de seed (§5)

Al arrancar se crean: 5 cursos (Salsa Cubana N1/N2, Son Cubano, Bachata Sensual, Reggaeton Heels), 5 profesores, 10 estudiantes con estados variados, varios leads y el evento "Guarachando Summer 2026". Todo editable desde el admin.

## Estado actual del proyecto (junio 2026)

- [x] Backend completo: auth, CRM, catálogo, redes, generación de imágenes
- [x] Frontend público: Hero con video, cursos, eventos, horarios, contacto, legal
- [x] Panel de admin funcional
- [x] i18n ES/CA/EN
- [x] Hero con video de fondo (`bailandoSalsa.optimize.mp4`)
- [x] Selector de idioma con banderas desplegable
- [ ] Logo definitivo del cliente (`frontend/public/logo.png`)
- [ ] Tokens reales de redes sociales (IG, YouTube)
- [ ] Configurar SMTP para envío de email
- [ ] Certificado SSL en producción (acme-companion lo gestiona automáticamente)
- [ ] Textos legales revisados por jurista

## Convenciones

- CSS: variables en `theme.css` (`--green`, `--bg`, `--surface`, `--text`, `--border`)
- Rutas API: `/api/...` (auth en `/api/auth/...`, admin en `/api/admin/...`, público en `/api/public/...`)
- Media en runtime: `/media/<carpeta>/<archivo>` servido por FastAPI desde `data/media/`
- Media estática del build: `frontend/src/media/` importada por Vite → `dist/assets/`
- Idiomas: i18next, claves tipo `nav.home`, `home.heroTitle`, `common.viewMore`
