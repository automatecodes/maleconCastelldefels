"""Inscripciones (admin)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.enrollment import Enrollment
from app.schemas.crm import EnrollmentCreate, EnrollmentOut

router = APIRouter(prefix="/api/admin/enrollments", tags=["admin:enrollments"],
                   dependencies=[Depends(require_admin)])


@router.get("", response_model=list[EnrollmentOut])
def list_enrollments(db: Session = Depends(get_db), course_id: int | None = None):
    q = db.query(Enrollment)
    if course_id:
        q = q.filter(Enrollment.course_id == course_id)
    return q.all()


@router.post("", response_model=EnrollmentOut, status_code=201)
def create_enrollment(payload: EnrollmentCreate, db: Session = Depends(get_db)):
    enrollment = Enrollment(**payload.model_dump())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.delete("/{enrollment_id}", status_code=204)
def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.get(Enrollment, enrollment_id)
    if enrollment:
        db.delete(enrollment)
        db.commit()
