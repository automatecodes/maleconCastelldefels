"""Datos semilla (§5). Idempotente: no duplica si ya existen datos.

Ejecutar:  python -m app.seed
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import random

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
import app.models  # noqa: F401
from app.models.user import User
from app.models.teacher import Teacher
from app.models.course import Course
from app.models.session import ClassSession
from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.event import Event, EventPhoto
from app.models.lead import Lead
from app.models.social import SocialPost

PLACEHOLDER_IMG = "/media/escuela/placeholder.jpg"


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add(User(
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                full_name="Administración Malecón",
                role="admin",
            ))
            print(f"  + usuario admin: {settings.ADMIN_EMAIL}")

        if db.query(Course).count() > 0:
            db.commit()
            print("  = ya había datos de catálogo; seed omitido (solo admin).")
            return

        # ---------- Profesores ----------
        teachers_data = [
            ("carlos-rodriguez", "Carlos Rodríguez", "Salsa Cubana, Son", "Bailarín y formador con más de 15 años en salsa cubana."),
            ("maria-gonzalez", "María González", "Bachata Sensual, Lady Style", "Especialista en bachata sensual y expresión corporal."),
            ("yoel-perez", "Yoel Pérez", "Salsa Cubana, Rueda de Casino", "Director de rueda de casino, energía 100% cubana."),
            ("laura-martinez", "Laura Martínez", "Reggaeton, Heels", "Coreógrafa de reggaeton y heels, estilo urbano latino."),
            ("dayron-fernandez", "Dayron Fernández", "Son Cubano, Timba", "Músico y bailarín, raíces del son tradicional."),
        ]
        teachers = {}
        for slug, name, spec, bio in teachers_data:
            t = Teacher(
                slug=slug, full_name=name, specialties=spec, bio=bio,
                email=f"{slug}@elmaleconcastelldefels.com",
                photo_url=f"/media/profesores/{slug}/foto.jpg",
                cv_pdf_url=f"/media/profesores/{slug}/cv.pdf",
                video_url=None, is_active=True,
            )
            db.add(t)
            teachers[slug] = t
        db.flush()

        # ---------- Cursos (5) ----------
        courses_data = [
            ("salsa-cubana-n1", "Salsa Cubana", "N1", "Salsa", "#2FE56B",
             ["carlos-rodriguez", "yoel-perez"], "Sala A", 20, 0, True,
             "Iniciación a la salsa cubana: pasos básicos, vacílala y dile que no. No se necesita pareja."),
            ("salsa-cubana-n2", "Salsa Cubana", "N2", "Salsa", "#F59E0B",
             ["yoel-perez"], "Sala A", 18, 1, True,
             "Nivel intermedio: figuras enlazadas, rueda de casino y musicalidad."),
            ("bachata-sensual-n1", "Bachata Sensual", "N1", "Bachata", "#E5482F",
             ["maria-gonzalez"], "Sala B", 20, 3, True,
             "Bachata sensual desde cero: conexión, ondas y movimiento de cadera."),
            ("son-cubano", "Son Cubano", "Único", "Son", "#2F9EE5",
             ["dayron-fernandez"], "Sala B", 16, 0, False,
             "El origen de la salsa: elegancia y sabor del son cubano tradicional."),
            ("reggaeton-heels", "Reggaeton / Heels", "Abierto", "Urbano", "#B62FE5",
             ["laura-martinez"], "Sala C", 24, 5, False,
             "Coreografías de reggaeton y heels. Actitud, fuerza y estilo urbano latino."),
        ]
        weekday_map = {  # (weekday, start, end)
            "salsa-cubana-n1": (0, "19:00", "20:00"),
            "salsa-cubana-n2": (0, "20:00", "21:00"),
            "bachata-sensual-n1": (2, "19:00", "20:00"),
            "son-cubano": (2, "20:00", "21:00"),
            "reggaeton-heels": (4, "19:30", "20:30"),
        }
        courses = {}
        for (slug, name, level, style, color, tslugs, room, cap, occ, feat, desc) in courses_data:
            c = Course(
                slug=slug, name=name, level=level, style=style, description=desc,
                calendar_color=color, room=room, capacity=cap,
                duration="10 sem · 1h/sem", price=Decimal("33.00"),
                trial_price=Decimal("12.50"), status="abierto", featured=feat,
                image_url=f"/media/cursos/{slug}/imagen.jpg",
            )
            c.teachers = [teachers[ts] for ts in tslugs]
            db.add(c)
            courses[slug] = c
            db.flush()
            wd, start, end = weekday_map[slug]
            db.add(ClassSession(
                course_id=c.id, teacher_id=c.teachers[0].id, weekday=wd,
                start_time=start, end_time=end, room=room, capacity=cap,
            ))

        # ---------- Estudiantes (10) ----------
        first_names = ["Ana", "Luis", "Marta", "Jordi", "Sara", "Pau", "Elena",
                       "David", "Núria", "Sergio"]
        last_names = ["García", "López", "Puig", "Roca", "Vidal", "Soler", "Mas",
                      "Serra", "Costa", "Bosch"]
        statuses = ["activo", "activo", "activo", "activo", "prueba", "activo",
                    "lead", "baja", "lista de espera", "activo"]
        sources = ["whatsapp", "web", "redes", "recomendacion", "evento",
                   "web", "whatsapp", "redes", "web", "recomendacion"]
        levels = ["N1", "N1", "N2", "N1", "Único", "Abierto", "N1", "N2", "N1", "N1"]
        course_slugs = list(courses.keys())
        base_day = datetime.now(timezone.utc)

        for i in range(10):
            created = base_day - timedelta(days=random.randint(5, 240))
            s = Student(
                first_name=first_names[i], last_name=last_names[i],
                email=f"{first_names[i].lower()}.{last_names[i].lower()}@example.com",
                phone=f"+34 6{random.randint(10000000, 99999999)}",
                city="Castelldefels", postal_code="08860",
                current_level=levels[i], status=statuses[i], lead_source=sources[i],
                enroll_date=date.today() - timedelta(days=random.randint(5, 200)),
                consent_given="si", consent_date=datetime.now(timezone.utc),
            )
            s.created_at = created
            db.add(s)
            db.flush()
            if statuses[i] in ("activo", "prueba"):
                cslug = course_slugs[i % len(course_slugs)]
                db.add(Enrollment(
                    student_id=s.id, course_id=courses[cslug].id,
                    enroll_date=date.today(),
                    status="activo" if statuses[i] == "activo" else "prueba",
                    price=Decimal("33.00"),
                ))

        # ---------- Leads de ejemplo ----------
        for i in range(6):
            l = Lead(
                name=f"Interesado {i+1}", email=f"lead{i+1}@example.com",
                phone=f"+34 6{random.randint(10000000, 99999999)}",
                level=random.choice(["N1", "N2", "Abierto"]),
                course_interest_id=courses[random.choice(course_slugs)].id,
                message="Hola, me gustaría información sobre las clases de prueba.",
                preferred_channel="whatsapp",
                status=random.choice(["nuevo", "contactado", "convertido", "descartado"]),
                source=random.choice(["web", "whatsapp", "redes"]),
            )
            l.created_at = base_day - timedelta(days=random.randint(1, 90))
            db.add(l)

        # ---------- Evento Guarachando 2026 (§5.1) ----------
        ev = Event(
            slug="guarachando-summer-2026",
            name="Guarachando Summer 2026 — Pool Party & Dance Festival (10ª edición)",
            subtitle="Décimo aniversario · salsa, bachata y buena vibra",
            description=(
                "La 10ª edición del Guarachando Summer llega cargada de salsa, bachata "
                "y la mejor energía latina. Un día completo de talleres, piscina, "
                "gastronomía y baile social junto al mar."
            ),
            image_url="/media/eventos/guarachando-2026/principal.jpg",
            date=date(2026, 6, 20), time_range="11:00 – 23:00",
            location="Racó de Mar — C/ Letra D, Santa Llúcia 12, Vilanova i la Geltrú (Barcelona)",
            price=Decimal("35.00"), artists="DJ Mauri", styles="Salsa, Bachata",
            activities=(
                "Talleres de danza\nPiscina con animaciones\nComida / gastronomía variada\n"
                "Sesión social de baile libre\nShows y animaciones continuas\n"
                "Pastel del 10º aniversario + brindis con cava"
            ),
            notes="Contacto: WhatsApp +34 672 895 239",
            status="publicado",
        )
        db.add(ev)
        db.flush()
        for n in range(1, 5):
            db.add(EventPhoto(event_id=ev.id,
                              url=f"/media/eventos/guarachando-2026/galeria/foto{n}.jpg",
                              caption=f"Edición anterior {n}"))

        # ---------- Posts de redes (placeholder hasta tener tokens) ----------
        platforms = [
            ("instagram", "https://instagram.com/elmaleconcastelldefels"),
            ("facebook", "https://facebook.com/elmaleconcastelldefels"),
            ("youtube", "https://youtube.com/@elmaleconcastelldefels"),
            ("tiktok", "https://tiktok.com/@elmaleconcastelldefels"),
        ]
        for i, (plat, link) in enumerate(platforms):
            db.add(SocialPost(
                platform=plat,
                text=f"¡Nueva publicación en {plat.capitalize()}! Conecta tu token en .env para el feed real.",
                thumbnail_url=PLACEHOLDER_IMG, permalink=link,
                published_at=base_day - timedelta(days=i),
            ))

        db.commit()
        print("  + 5 profesores, 5 cursos, 10 estudiantes, leads, evento Guarachando, social.")
        print("Seed completado.")
    finally:
        db.close()

    # Genera imágenes iniciales (IA si hay clave; si no, placeholder de marca).
    try:
        from app.generate_images import run as gen_images
        print("Generando imágenes iniciales (cursos y eventos)…")
        gen_images()
    except Exception as exc:  # noqa: BLE001
        print(f"  (aviso) no se pudieron generar imágenes ahora: {exc}")


if __name__ == "__main__":
    print("Sembrando base de datos…")
    run()
