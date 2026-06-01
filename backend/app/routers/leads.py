"""Bandeja de Leads (admin): gestión y conversión a estudiante."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.lead import Lead
from app.models.student import Student
from app.schemas.crm import LeadOut, LeadUpdate, StudentOut

router = APIRouter(prefix="/api/admin/leads", tags=["admin:leads"],
                   dependencies=[Depends(require_admin)])


@router.get("", response_model=list[LeadOut])
def list_leads(db: Session = Depends(get_db), status: str | None = None):
    q = db.query(Lead)
    if status:
        q = q.filter(Lead.status == status)
    return q.order_by(Lead.created_at.desc()).all()


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, payload: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead no encontrado")
    if payload.status:
        lead.status = payload.status
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/convert", response_model=StudentOut)
def convert_lead(lead_id: int, db: Session = Depends(get_db)):
    """Convierte un lead en estudiante (estado 'prueba')."""
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead no encontrado")
    parts = (lead.name or "").split(" ", 1)
    student = Student(
        first_name=parts[0] or lead.name,
        last_name=parts[1] if len(parts) > 1 else None,
        email=lead.email,
        phone=lead.phone,
        current_level=lead.level,
        status="prueba",
        lead_source=lead.source,
        enroll_date=date.today(),
    )
    db.add(student)
    lead.status = "convertido"
    db.commit()
    db.refresh(student)
    return student
