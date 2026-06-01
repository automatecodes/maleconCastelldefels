"""Seed de datos reales de elMalecón Castelldefels.

Crea tablas (si no existen), usuarios admin, profesores, cursos, sesiones,
eventos y datos de muestra de estudiantes/leads. Es idempotente: los registros
con slug/email único se actualizan, no se duplican.

Ejecutar:  python -m app.seed
"""
from datetime import date, datetime

from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app import models


def upsert_setting(db, key: str, value: str):
    s = db.query(models.SiteSetting).filter_by(key=key).first()
    if s:
        s.value = value
    else:
        db.add(models.SiteSetting(key=key, value=value))


def run():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Admin users ──────────────────────────────────────────────────────
        for email, password, full_name in [
            (settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD, "Administrador"),
            ("info@elmalecondelasalsa.com", "g45grTg6h456tTrgFG", "El Malecón Admin"),
        ]:
            u = db.query(models.User).filter_by(email=email).first()
            if not u:
                db.add(models.User(
                    email=email,
                    hashed_password=get_password_hash(password),
                    full_name=full_name,
                    role="admin",
                ))
        db.flush()

        # ── Profesores ───────────────────────────────────────────────────────
        teachers_data = [
            ("aroa",          "Aroa",          "Salsa, Son Cubano",    "Profesora de salsa y son cubano.",                              "/media/profesores/aroa/foto.jpg"),
            ("frederic",      "Frederic",       "Merengue, Bachata",   "Especialista en ritmos caribeños.",                             "/media/profesores/frederic/foto.jpg"),
            ("jorge",         "Jorge",          "Salsa Cubana",        "Profesor de salsa cubana con años de experiencia.",              "/media/profesores/jorge/foto.jpg"),
            ("juanjo",        "Juanjo",         "DJ, Animación",       "DJ y animador oficial de los eventos de elMalecón.",             "/media/profesores/juanjo/foto.jpg"),
            ("monica",        "Mónica",         "Bachata, Lady Style", "Profesora de bachata sensual y estilo chica.",                   "/media/profesores/monica/foto.jpg"),
            ("sergi",         "Sergi",          "Salsa, Cha-Cha",      "Profesor con experiencia en salsa y ritmos clásicos.",           "/media/profesores/sergi/foto.jpg"),
            ("telma",         "Telma",          "Salsa, Bachata",      "Bailarina y profesora habitual en los eventos del Malecón.",     "/media/profesores/telma/foto.jpg"),
            ("marta",         "Marta",          "Bachata, Estilo Chica","Especialista en Estilo Chica de Bachata.",                      None),
            ("yasmany",       "Yasmany",        "Salsa, Rumba, Son",   "Profesor de salsa con raíces cubanas.",                         None),
            ("mario-layunta", "Mario Layunta",  "Cha-Cha, Boogaloo",  "Especialista en ritmos clásicos latinos.",                       None),
        ]
        teacher_map = {}
        for slug, full_name, specialties, bio, photo_url in teachers_data:
            t = db.query(models.Teacher).filter_by(slug=slug).first()
            if not t:
                t = models.Teacher(slug=slug)
                db.add(t)
            t.full_name = full_name
            t.specialties = specialties
            t.bio = bio
            t.photo_url = photo_url
            t.is_active = True
            db.flush()
            teacher_map[slug] = t.id

        # ── Cursos ───────────────────────────────────────────────────────────
        courses_data = [
            {
                "slug": "salsa-inicio", "name": "Salsa Inicio",
                "level": "Inicio", "style": "Salsa Cubana",
                "room": "Sala 1", "capacity": 20, "price": "33", "trial_price": "12.5",
                "status": "abierto", "featured": True, "color": "#2FE56B",
                "description": "Aprende los pasos básicos de la Salsa Cubana desde cero. Matrícula gratis. Jueves 19h-21h.",
                "teacher_slugs": ["jorge"],
                "sessions": [(3, "19:00", "21:00", "Sala 1")],
            },
            {
                "slug": "bachata-inicio", "name": "Bachata Inicio",
                "level": "Inicio", "style": "Bachata",
                "room": "Sala 2", "capacity": 20, "price": "33", "trial_price": "12.5",
                "status": "abierto", "featured": True, "color": "#F59E0B",
                "description": "Introducción a la Bachata: bases, conexión y sensualidad. Lunes 18h-20h.",
                "teacher_slugs": ["monica"],
                "sessions": [(0, "18:00", "20:00", "Sala 2")],
            },
            {
                "slug": "bachata-estilo-chica", "name": "Estilo Chica de Bachata",
                "level": "Inicio", "style": "Bachata / Lady Style",
                "room": "Sala 2", "capacity": 16, "price": "33", "trial_price": "0",
                "status": "abierto", "featured": False, "color": "#EC4899",
                "description": "Técnica femenina de Bachata: estilo, elegancia y movimiento. Miércoles 18h-19h. Con Marta.",
                "teacher_slugs": ["marta"],
                "sessions": [(2, "18:00", "19:00", "Sala 2")],
            },
            {
                "slug": "merengue-inicio", "name": "Merengue Inicio",
                "level": "Inicio", "style": "Merengue",
                "room": "Sala 1", "capacity": 20, "price": "33", "trial_price": "0",
                "status": "abierto", "featured": False, "color": "#8B5CF6",
                "description": "Merengue Intensivo: ritmo, energía y diversión. Martes 18:30h-19:30h.",
                "teacher_slugs": ["frederic"],
                "sessions": [(1, "18:30", "19:30", "Sala 1")],
            },
            {
                "slug": "salsa-rumba-son", "name": "Salsa con Rumba y Son Cubano",
                "level": "Intermedio", "style": "Salsa / Rumba / Son",
                "room": "Sala 1", "capacity": 18, "price": "33", "trial_price": "0",
                "status": "abierto", "featured": True, "color": "#EF4444",
                "description": "Nivel intermedio: fusión de Salsa, Rumba y Son Cubano. Miércoles 20h-22h. Con Yasmany & Aroa.",
                "teacher_slugs": ["yasmany", "aroa"],
                "sessions": [(2, "20:00", "22:00", "Sala 1")],
            },
            {
                "slug": "cha-cha-boogaloo", "name": "Cha-Cha Boogaloo",
                "level": "Inicio", "style": "Cha-Cha / Boogaloo",
                "room": "Sala 1", "capacity": 20, "price": "33", "trial_price": "0",
                "status": "abierto", "featured": False, "color": "#F97316",
                "description": "Ritmos clásicos latinos: Cha-Cha y Boogaloo. Viernes 18h-19h. Con Mario Layunta.",
                "teacher_slugs": ["mario-layunta"],
                "sessions": [(4, "18:00", "19:00", "Sala 1")],
            },
        ]
        course_map = {}
        for c in courses_data:
            course = db.query(models.Course).filter_by(slug=c["slug"]).first()
            if not course:
                course = models.Course(slug=c["slug"])
                db.add(course)
            course.name = c["name"]
            course.level = c["level"]
            course.style = c["style"]
            course.room = c["room"]
            course.capacity = c["capacity"]
            course.price = c["price"]
            course.trial_price = c["trial_price"]
            course.status = c["status"]
            course.featured = c["featured"]
            course.calendar_color = c["color"]
            course.description = c["description"]
            course.image_url = f"/media/cursos/{c['slug']}/imagen.jpg"
            course.duration = "Intensivo Jun-Jul"
            db.flush()
            course_map[c["slug"]] = course.id
            course.teachers = [
                db.query(models.Teacher).get(teacher_map[s])
                for s in c["teacher_slugs"] if s in teacher_map
            ]
            db.query(models.ClassSession).filter_by(course_id=course.id).delete()
            for weekday, start, end, room in c["sessions"]:
                db.add(models.ClassSession(
                    course_id=course.id,
                    teacher_id=teacher_map.get(c["teacher_slugs"][0]) if c["teacher_slugs"] else None,
                    weekday=weekday, start_time=start, end_time=end, room=room,
                    capacity=c["capacity"],
                ))

        # ── Eventos ───────────────────────────────────────────────────────────
        events_data = [
            {
                "slug": "50-salsa-50-bachata-2026-05-15",
                "name": "Evento 50% Salsa y 50% Bachata",
                "subtitle": "Luz de Luna · elMalecón Castelldefels",
                "description": "Noche de baile 50% salsa y 50% bachata con exhibición, animaciones e invitados especiales. DJ Juanjo. Entrada 10€.",
                "date": date(2026, 5, 15), "time_range": "22:30 – 03:00",
                "location": "elMalecón Castelldefels, Carrer 5 22, Castelldefels",
                "artists": "Yasmany / De Cuba Vengo, DJ Juanjo", "styles": "Salsa, Bachata",
                "status": "histórico",
                "image_url": "/media/eventos/50-salsa-50-bachata-2026-05-15/principal.jpg",
            },
            {
                "slug": "fiesta-loz-de-luna-2026-05-22",
                "name": "Fiesta de Salsa y Bachata con Loz de Luna",
                "subtitle": "Loz de Luna · elMalecón Castelldefels",
                "description": "Noche de baile con Loz de Luna y DJ Juanjo; salsa, bachata y animaciones de Henry. Entrada 10€ con consumición.",
                "date": date(2026, 5, 22), "time_range": "22:30 – 03:00",
                "location": "elMalecón Castelldefels, Carrer 5 22, Castelldefels",
                "artists": "Loz de Luna, DJ Juanjo, Henry", "styles": "Salsa, Bachata",
                "status": "histórico",
                "image_url": "/media/eventos/fiesta-loz-de-luna-2026-05-22/principal.jpg",
            },
            {
                "slug": "social-salsa-bachata-2026-05-29",
                "name": "Social de Salsa y Bachata",
                "subtitle": "Luz de Luna · elMalecón Castelldefels",
                "description": "Noche social 50% salsa y 50% bachata con DJ Juanjo y animaciones sociales.",
                "date": date(2026, 5, 29), "time_range": "22:30 – 03:00",
                "location": "elMalecón Castelldefels, Carrer 5 22, Castelldefels",
                "artists": "DJ Juanjo", "styles": "Salsa, Bachata",
                "status": "histórico",
                "image_url": "/media/eventos/social-salsa-bachata-2026-05-29/principal.jpg",
            },
            {
                "slug": "fiesta-caribena-2026-06-05",
                "name": "Fiesta Caribeña - Luz de Luna",
                "subtitle": "¡Llega el sabor del Caribe a Castelldefels!",
                "description": "Fiesta caribeña de Luz de Luna con ambiente de baile y percusión en directo.",
                "date": date(2026, 6, 5), "time_range": "Por confirmar",
                "location": "elMalecón Castelldefels",
                "artists": "DJ Juanjo", "styles": "Salsa, Bachata, Caribeño",
                "status": "próximo", "image_url": None,
            },
            {
                "slug": "cumple-telma-2026-06-12",
                "name": "Cumple Telma: Salsa y Bachata",
                "subtitle": "Luz de Luna · elMalecón Castelldefels",
                "description": "Fiesta de cumpleaños de Telma con salsa y bachata, animaciones y show Caramelo con Bombón de Alejandro y Rosy. Entrada 10€.",
                "date": date(2026, 6, 12), "time_range": "22:30 – 03:00",
                "location": "elMalecón Castelldefels, Carrer 5 22, Castelldefels",
                "artists": "Alejandro y Rosy, DJ Juanjo", "styles": "Salsa, Bachata",
                "status": "próximo",
                "image_url": "/media/eventos/cumple-telma-2026-06-12/principal.jpg",
            },
            {
                "slug": "tardeo-salsa-bachata-2026-06-13",
                "name": "Tardeo Salsa y Bachata",
                "subtitle": "Plaza de las Palmeras · Castelldefels",
                "description": "Talleres y exhibiciones de bachata y salsa en la Plaza de las Palmeras. Con Mayker el Happy, Mónica, Juanjo y Telma, Claudio Díaz y Mónica, Carlos y Anaís. Social con El Chama DJ.",
                "date": date(2026, 6, 13), "time_range": "16:30 – 21:30",
                "location": "Plaza de las Palmeras, Castelldefels",
                "artists": "Mayker el Happy, Mónica, Juanjo, Telma, Claudio Díaz, El Chama DJ",
                "styles": "Salsa, Bachata",
                "activities": "Talleres 18:30\nExhibiciones 19:00\nSocial 20:00",
                "status": "próximo",
                "image_url": "/media/eventos/tardeo-salsa-bachata-2026-06-13/principal.jpg",
            },
            {
                "slug": "guarachando-noche-2026-06-20",
                "name": "Guarachando Noche - 10º Aniversario",
                "subtitle": "Racó de Mar · Vilanova i la Geltrú",
                "description": "Programación de gala, coreos de fin de curso, homenaje 10 aniversario, concurso de baile y disfraces años 90, brindis y social con DJ. Entradas limitadas.",
                "date": date(2026, 6, 20), "time_range": "20:00 – 23:00",
                "location": "Racó de Mar, Carrer Lletra D Santa Llúcia 12, Vilanova i la Geltrú",
                "artists": "DJ Juanjo, Telma, Mónica", "styles": "Salsa, Bachata, Son",
                "activities": "Gala fin de curso\nConcurso disfraces años 90\nBrindis 10 aniversario\nSocial con DJ",
                "status": "próximo",
                "image_url": "/media/eventos/guarachando-noche-2026-06-20/principal.jpg",
            },
            {
                "slug": "fiesta-blanca-2026-06-26",
                "name": "Fiesta Blanca - Luz de Luna",
                "subtitle": "Dress code blanco · elMalecón Castelldefels",
                "description": "Fiesta temática blanca de Luz de Luna. Dress code blanco. Ritmo, alegría y mucho baile.",
                "date": date(2026, 6, 26), "time_range": "Por confirmar",
                "location": "elMalecón Castelldefels",
                "artists": "DJ Juanjo", "styles": "Salsa, Bachata",
                "status": "próximo", "image_url": None,
            },
        ]
        for ev in events_data:
            event = db.query(models.Event).filter_by(slug=ev["slug"]).first()
            if not event:
                event = models.Event(slug=ev["slug"])
                db.add(event)
            for k, v in ev.items():
                if k != "slug":
                    setattr(event, k, v)

        # ── Publicaciones sociales placeholder ───────────────────────────────
        if db.query(models.SocialPost).count() == 0:
            for platform, text_body, permalink in [
                ("instagram", "🎉 ¡Guarachando Noche 10 aniversario! 20 de junio. Entradas limitadas.", "https://instagram.com/elmaleconcastelldefels"),
                ("facebook",  "🌴 Cursos intensivos de salsa y bachata en Castelldefels. Matrícula gratis.", "https://facebook.com/elmalecondelasalsa"),
                ("youtube",   "Clases de Salsa Cubana — elMalecón Castelldefels", "https://youtube.com/@elmaleconcastelldefels"),
            ]:
                db.add(models.SocialPost(platform=platform, text=text_body,
                                         permalink=permalink, published_at=datetime.now()))

        # ── Configuración del sitio ──────────────────────────────────────────
        upsert_setting(db, "APP_NAME", "elMalecón Castelldefels")
        upsert_setting(db, "ADDRESS", "Carrer de Tomàs Edison, 20, 08860 Castelldefels, Barcelona")
        upsert_setting(db, "PHONE", "672 89 52 39")

        db.commit()
        print("✅  Seed completado — datos reales de elMalecón Castelldefels cargados.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
