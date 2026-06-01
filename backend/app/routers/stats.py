"""Panel de estadísticas (KPIs de centro formativo) — §4.3."""
from collections import defaultdict
from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.student import Student
from app.models.course import Course
from app.models.teacher import Teacher
from app.models.lead import Lead
from app.models.event import Event
from app.models.enrollment import Enrollment

router = APIRouter(prefix="/api/admin/stats", tags=["admin:stats"],
                   dependencies=[Depends(require_admin)])


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    courses = db.query(Course).all()
    teachers = db.query(Teacher).all()
    leads = db.query(Lead).all()

    total_active = len([s for s in students if s.status == "activo"])
    total_bajas = len([s for s in students if s.status == "baja"])
    total_leads_state = len([s for s in students if s.status == "lead"])

    # Retención / abandono
    base = total_active + total_bajas
    retention = round(total_active / base * 100, 1) if base else 0.0
    churn = round(total_bajas / base * 100, 1) if base else 0.0

    # Distribución por nivel
    by_level = defaultdict(int)
    for s in students:
        by_level[s.current_level or "sin nivel"] += 1

    # Ocupación por curso (% capacidad)
    occupancy = []
    by_course = []
    for c in courses:
        enrolled = c.enrolled_count
        cap = c.capacity or 0
        pct = round(enrolled / cap * 100, 1) if cap else 0.0
        occupancy.append({"course": c.name, "level": c.level, "enrolled": enrolled,
                          "capacity": cap, "occupancy_pct": pct, "color": c.calendar_color})
        by_course.append({"course": f"{c.name} {c.level or ''}".strip(),
                          "students": enrolled, "color": c.calendar_color})

    # Captación: leads por origen y conversión
    by_source = defaultdict(int)
    whatsapp_clicks = 0
    converted = 0
    for l in leads:
        by_source[l.source or "desconocido"] += 1
        if l.source == "whatsapp" and l.name == "(clic WhatsApp)":
            whatsapp_clicks += 1
        if l.status == "convertido":
            converted += 1
    real_leads = [l for l in leads if l.name != "(clic WhatsApp)"]
    conversion_rate = round(converted / len(real_leads) * 100, 1) if real_leads else 0.0

    # Carga por profesor
    teacher_load = []
    for t in teachers:
        n_courses = len(t.courses)
        n_students = sum(c.enrolled_count for c in t.courses)
        teacher_load.append({"teacher": t.full_name, "courses": n_courses,
                             "students": n_students})

    # Eventos próximos
    today = date.today()
    upcoming = [{"name": e.name, "date": e.date.isoformat() if e.date else None}
                for e in db.query(Event).all() if e.date and e.date >= today]

    # Series temporales: altas y leads por mes
    altas_por_mes = _series([s.created_at for s in students if s.created_at])
    leads_por_mes = _series([l.created_at for l in real_leads if l.created_at])

    return {
        "alumnado": {
            "activos": total_active,
            "altas_lead": total_leads_state,
            "bajas": total_bajas,
            "retencion_pct": retention,
            "abandono_pct": churn,
        },
        "distribucion_por_nivel": dict(by_level),
        "ocupacion_por_curso": occupancy,
        "estudiantes_por_curso": by_course,
        "captacion": {
            "por_origen": dict(by_source),
            "tasa_conversion_pct": conversion_rate,
            "clics_whatsapp": whatsapp_clicks,
            "total_leads": len(real_leads),
            "convertidos": converted,
        },
        "carga_profesorado": teacher_load,
        "eventos_proximos": upcoming,
        "series": {
            "altas_por_mes": altas_por_mes,
            "leads_por_mes": leads_por_mes,
        },
        # Bloque de ingresos: placeholder hasta la fase de pagos (§11)
        "ingresos": {"enabled": False, "nota": "Se activa con la fase de pagos (§11)."},
    }


def _series(dates: list[datetime]) -> list[dict]:
    buckets = defaultdict(int)
    for d in dates:
        buckets[d.strftime("%Y-%m")] += 1
    return [{"month": k, "count": buckets[k]} for k in sorted(buckets)]
