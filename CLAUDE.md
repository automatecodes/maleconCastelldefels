# elMalecón Castelldefels — Contexto del proyecto

## Qué es este proyecto

Web completa para una **escuela de baile latino** en Castelldefels (Barcelona).
Dominio: `elmaleconcastelldefels.com`. Estética: verde neón (#2FE56B) sobre fondos oscuros (#0A0E0B).
URL real de la escuela: Carrer de Tomàs Edison, 20, 08860 Castelldefels. Tel: 672 89 52 39.

## Stack

| Servicio     | Tecnología                              | Puerto local |
|------------- |-----------------------------------------|--------------|
| `api`        | Python 3.12 · FastAPI · SQLAlchemy ORM  | 8000         |
| `db`         | PostgreSQL 16 (volumen `data/db/`)      | 5432         |
| `worker`     | Python · caché de redes sociales        | —            |
| `frontend`   | React 18 + Vite · i18n (ES/CA/EN)       | 5173 / 8080  |
| Proxy (prod) | nginx + acme-companion (SSL automático) | 80/443       |

## Arranque rápido

```bash
# Todo con Docker (recomendado)
docker compose -f docker-compose.yml -f dev.yml up --build

# Solo frontend (hot reload)
cd frontend && npm install && npm run dev   # proxy /api y /media → :8000

# Solo backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Estructura clave

```text
backend/app/
  core/         → config.py (Settings + ANTHROPIC_API_KEY), database.py, deps.py, security.py
  models/       → Course, Teacher (many-to-many course_teachers), Student, Enrollment,
                  ClassSession, Event, EventPhoto, Lead, User, SiteSetting, SocialPost,
                  ConsentLog, MediaFile (nuevo: metadatos SEO de media)
  routers/      → students (con enrollments anidados y consistencia de estado)
                  teachers (con asignación de cursos y protección de desactivación)
                  courses (con endpoints /students para gestión de inscritos)
                  events (status calculado automáticamente por fecha)
                  media (list, upload, delete, metadata)
                  themes (selector CSS + export/import variables JSON)
                  public, auth, leads, enrollments, stats, images
  schemas/      → crm.py (StudentOut incluye EnrollmentBrief[])
                  catalog.py (EventOut incluye computed_status)
  services/     → email.py, image_ai.py (claude|openai|stability|placeholder)
  seed.py       → Datos REALES: 10 profesores, 6 cursos, 9 eventos, 2 admins

frontend/src/
  pages/        → Home, Courses, Events, School, Schedule, Contact, Legal
  pages/admin/  → Dashboard, StudentsAdmin (panel inscripciones), CoursesAdmin (gestión profes/alumnos),
                  TeachersAdmin (asignación cursos), EventsAdmin (status auto), LeadsAdmin,
                  Appearance (editor vars CSS + export/import), MediaAdmin (explorador)
  components/   → Header (logo solo), Footer (2 cols, iconos SVG redes), LanguageSelector (banderas)
                  CourseCard, Carousel, WhatsAppButton, SocialFeed, Modal, CookieBanner
  i18n/         → es.json, ca.json, en.json
  media/        → bailandoSalsa.optimize.mp4 (vídeo hero)
  api/client.js → fetch wrappers hacia /api/*
```

## Variables de entorno clave

| Variable               | Uso                                                |
|------------------------|----------------------------------------------------|
| `JWT_SECRET`           | Firmar tokens JWT — cambiar en producción          |
| `ADMIN_EMAIL/PASSWORD` | Primer admin (seed)                                |
| `POSTGRES_*`           | Conexión PostgreSQL                                |
| `SMTP_*`               | Email (Gmail con App Password o Brevo/SES)         |
| `WHATSAPP_NUMBER`      | +34672895239 (botón flotante + formulario contacto)|
| `IMAGE_AI_PROVIDER`    | `claude` \| `openai` \| `stability` \| vacío       |
| `ANTHROPIC_API_KEY`    | Para proveedor `claude` (genera SVG artístico)     |
| `IMAGE_AI_KEY`         | Para openai o stability                            |
| `IG_TOKEN/YOUTUBE_*`   | Tokens redes sociales (vacío = placeholders)       |

## Administración

**URL privada:** `/gurutiadmin` (NO `/admin`)

**Credenciales seed:**

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (de .env)
- `info@elmalecondelasalsa.com` / `g45grTg6h456tTrgFG`

## Datos reales cargados en seed (junio 2026)

**Profesores (10):** Aroa, Frederic, Jorge, Juanjo, Mónica, Sergi, Telma, Marta, Yasmany, Mario Layunta

**Cursos (6):**

| Curso                        | Día       | Horario     | Sala   |
|------------------------------|-----------|-------------|--------|
| Salsa Inicio                 | Jueves    | 19:00–21:00 | Sala 1 |
| Bachata Inicio               | Lunes     | 18:00–20:00 | Sala 2 |
| Estilo Chica de Bachata      | Miércoles | 18:00–19:00 | Sala 2 |
| Merengue Inicio              | Martes    | 18:30–19:30 | Sala 1 |
| Salsa con Rumba y Son Cubano | Miércoles | 20:00–22:00 | Sala 1 |
| Cha-Cha Boogaloo             | Viernes   | 18:00–19:00 | Sala 1 |

**Eventos (9):** Mayo–Junio 2026, desde Primer Tardeo hasta Fiesta Blanca.

## Media en runtime (NO en git)

Las imágenes se sirven desde `data/media/` montado como volumen Docker.
Las imágenes **no están en git** (excluidas por `.gitignore`).
Al desplegar en un servidor nuevo:

```bash
# Las imágenes de cursos, profesores y eventos ya están procesadas en data/media/
# Solo asegúrate de que el volumen Docker apunta a ese directorio
docker compose up -d
```

Rutas:

- `data/media/profesores/{slug}/foto.jpg` — foto del profesor
- `data/media/cursos/{slug}/imagen.jpg` — imagen del curso
- `data/media/eventos/{slug}/principal.jpg` — flyer del evento
- `data/media/escuela/` — logo y fotos de la escuela

## Modelo de estudiante (actualizado)

**Status:** `inscrito` | `interesado` | `graduado` | `baja`
**Canal:** `web` | `whatsapp` | `redes` | `escuela` | `contactos`
**Campos nuevos:** `contact_date` (fecha primer contacto)
**Consistencia:** al poner `baja`, todos los enrollments activos pasan a `baja` automáticamente.

## Convenciones

- CSS: variables en `theme.css`. Variables personalizadas en `site_settings` (key=`CSS_VAR_*`)
- Eventos: `computed_status` calculado por fecha en cada respuesta de la API
- Admin URL: `/gurutiadmin/*` — nunca exponerla en la UI pública
- Media: `GET /api/admin/media/list?folder=` → list | `POST /upload` | `DELETE /delete?path=` | `GET/PUT /metadata`
- Templates: `GET /api/admin/themes/export` → JSON | `POST /api/admin/themes/import` | `PUT /api/admin/themes/variables`

## Estado del proyecto (junio 2026)

- [x] Backend completo con todos los módulos
- [x] Frontend público multi-idioma ES/CA/EN
- [x] Panel admin en /gurutiadmin con todas las secciones
- [x] Datos reales: 10 profesores, 6 cursos, 9 eventos
- [x] Imágenes reales de cursos, profesores y eventos
- [x] Vídeo hero (bailandoSalsa.optimize.mp4)
- [x] Selector de idioma con banderas desplegable
- [x] Generación de imágenes con Claude API (SVG) u OpenAI/Stability (PNG)
- [x] Media Explorer en admin
- [x] Template export/import de variables CSS
- [ ] Logo definitivo del cliente (`frontend/public/logo.png`)
- [ ] Tokens reales de redes sociales (IG, YouTube, FB, TikTok)
- [ ] Configurar SMTP (Gmail App Password o Brevo)
- [ ] Datos biográficos completos de profesores (bio, email, especialidades)
- [ ] Datos de inscripción y horarios definitivos de cursos
- [ ] Certificado SSL en producción (acme-companion lo gestiona automáticamente)
- [ ] Textos legales revisados por jurista (Legal.jsx)
- [ ] Pasarela de pagos (estructura en BD lista, activar con PAYMENT_PROVIDER)
