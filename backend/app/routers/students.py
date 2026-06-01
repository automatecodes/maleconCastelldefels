"""CRUD de estudiantes (admin)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.student import Student
from app.schemas.crm import StudentCreate, StudentOut

router = APIRouter(prefix="/api/admin/students", tags=["admin:students"],
                   dependencies=[Depends(require_admin)])


@router.get("", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db), status: str | None = None):
    q = db.query(Student)
    if status:
        q = q.filter(Student.status == status)
    return q.order_by(Student.created_at.desc()).all()


@router.post("", response_model=StudentOut, status_code=201)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(404, "Estudiante no encontrado")
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentCreate, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(404, "Estudiante no encontrado")
    for k, v in payload.model_dump().items():
        setattr(student, k, v)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if student:
        db.delete(student)
        db.commit()
