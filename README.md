# elMalecón Castelldefels — elmaleconcastelldefels.com

<!-- Actualizado junio 2026 — test de flujo commit+rebuild -->

Web pública multi-idioma (ES/CA/EN) + panel de administración completo con CRM, calendario
visual, media explorer, generación de imágenes con IA, y formulario de contacto integrado
con WhatsApp y email.

> **Estética:** verde neón "glow" sobre fondos oscuros, energía de club latino.
> El **logo lo sube el cliente:** coloca `logo.png` en `frontend/public/`.

---

## 🧱 Stack

| Servicio   | Tecnología                              |
|------------|-----------------------------------------|
| `api`      | Python 3.12 · FastAPI · SQLAlchemy ORM  |
| `db`       | PostgreSQL 16                           |
| `worker`   | Python (caché de redes sociales)        |
| `frontend` | React 18 + Vite · i18n · Recharts       |

---

## 🚀 Puesta en marcha

### 1. Configurar el entorno

```bash
cp .env.example .env
# Edita .env: JWT_SECRET, POSTGRES_PASSWORD, ADMIN_PASSWORD, SMTP (opcional)
```

### 2. Desarrollo local (con Docker)

```bash
docker compose -f docker-compose.yml -f dev.yml up --build
```

- Web: `http://localhost:8080`
- API Swagger: `http://localhost:8000/docs`
- Admin: `http://localhost:8080/gurutiadmin`

### 3. Frontend sin Docker (hot reload)

```bash
# Terminal 1 — backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend && npm install && npm run dev   # → http://localhost:5173
```

### 4. Producción

```bash
docker network create proxyNet   # solo la primera vez
docker compose up --build -d
```

El servicio `frontend` se publica automáticamente con `VIRTUAL_HOST` y `LETSENCRYPT_HOST`.

---

## 🔑 Acceso al admin

**URL:** `/gurutiadmin` (privada — no se expone en la UI pública)

Credenciales iniciales (de `.env`):

```text
ADMIN_EMAIL / ADMIN_PASSWORD
info@elmalecondelasalsa.com / (ver .env)
```

El panel incluye: estadísticas, CRM de estudiantes con inscripciones multi-curso,
profesores, cursos, eventos, leads, explorador de media y editor de apariencia.

---

## 🌱 Datos reales cargados (seed junio 2026)

**10 profesores:** Aroa, Frederic, Jorge, Juanjo, Mónica, Sergi, Telma, Marta, Yasmany, Mario Layunta

**6 cursos:**

| Curso                        | Día       | Horario     | Sala   |
|------------------------------|-----------|-------------|--------|
| Salsa Inicio                 | Jueves    | 19:00–21:00 | Sala 1 |
| Bachata Inicio               | Lunes     | 18:00–20:00 | Sala 2 |
| Estilo Chica de Bachata      | Miércoles | 18:00–19:00 | Sala 2 |
| Merengue Inicio              | Martes    | 18:30–19:30 | Sala 1 |
| Salsa con Rumba y Son Cubano | Miércoles | 20:00–22:00 | Sala 1 |
| Cha-Cha Boogaloo             | Viernes   | 18:00–19:00 | Sala 1 |

**9 eventos:** Mayo–Junio 2026, con flyers reales de Bailorama/Facebook.

Re-sembrar manualmente:

```bash
docker compose exec api python -m app.seed
```

---

## 🖼️ Media

Las imágenes se organizan en `data/media/` y se sirven en `/media/*`:

```text
data/media/
  escuela/              (logo, fotos instalaciones, hero.mp4)
  cursos/<slug>/        (imagen.jpg)
  profesores/<slug>/    (foto.jpg)
  eventos/<slug>/       (principal.jpg + galeria/)
```

Las imágenes **no están en git** (excluidas por `.gitignore`). Al desplegar en producción,
el directorio `data/media/` ya contiene las imágenes procesadas desde los flyers originales.

Gestión desde el admin: **Admin → Media** (upload, delete, alt text, SEO, link).

---

## 🎨 Generación de imágenes con IA

Módulo pluggable vía `.env`:

| Proveedor   | Variable clave      | Resultado | Notas                                            |
|-------------|---------------------|-----------|--------------------------------------------------|
| `claude`    | `ANTHROPIC_API_KEY` | SVG       | **Recomendado** — arte vectorial de alta calidad |
| `openai`    | `IMAGE_AI_KEY`      | PNG       | Usa gpt-image-1 o DALL-E                         |
| `stability` | `IMAGE_AI_KEY`      | PNG       | Stable Diffusion Core                            |
| *(vacío)*   | —                   | SVG       | Placeholder de marca offline                     |

```env
IMAGE_AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
IMAGE_AI_MODEL=claude-haiku-4-5-20251001   # opcional
```

Desde el admin: botón **✨** en cada curso o evento para generar y asignar la imagen.

---

## 🎭 Apariencia y temas

El admin incluye un editor visual de variables CSS con soporte para:

- Selección de hoja de estilos activa
- Editor de colores y tipografía con color pickers en tiempo real
- **Exportar tema** como JSON (`/api/admin/themes/export`)
- **Importar tema** desde JSON (reaplica todos los parámetros)

---

## 📋 Pendiente

- [ ] Logo definitivo (`frontend/public/logo.png`)
- [ ] Tokens reales de redes sociales (IG, YouTube, FB, TikTok)
- [ ] Configurar SMTP (Gmail App Password o Brevo)
- [ ] Datos completos de profesores (bio, email, especialidades)
- [ ] Revisar textos legales con jurista (`frontend/src/pages/Legal.jsx`)

## 🔭 Fases futuras

- **Login/cuentas:** tabla `users` con roles; `account_id` en estudiante/profesor.
- **Autorregistro:** flujo Lead→Estudiante listo; solo falta el endpoint + vista pública.
- **Pagos:** `Enrollment` con `payment_status`/`price`; activar con `PAYMENT_PROVIDER`.

---

## ✅ Cumplimiento

- **RGPD:** banner de cookies, consentimiento en formulario, `consent_logs`, textos legales.
- **SEO:** metaetiquetas, Open Graph, hreflang, `sitemap.xml`, `robots.txt`, schema.org.
