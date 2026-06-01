"""CRUD de profesores (admin)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.teacher import Teacher
from app.schemas.catalog import TeacherCreate, TeacherOut

router = APIRouter(prefix="/api/admin/teachers", tags=["admin:teachers"],
                   dependencies=[Depends(require_admin)])


@router.get("", response_model=list[TeacherOut])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).order_by(Teacher.full_name).all()


@router.post("", response_model=TeacherOut, status_code=201)
def create_teacher(payload: TeacherCreate, db: Session = Depends(get_db)):
    teacher = Teacher(**payload.model_dump())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.put("/{teacher_id}", response_model=TeacherOut)
def update_teacher(teacher_id: int, payload: TeacherCreate, db: Session = Depends(get_db)):
    teacher = db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(404, "Profesor no encontrado")
    for k, v in payload.model_dump().items():
        setattr(teacher, k, v)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", status_code=204)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.get(Teacher, teacher_id)
    if teacher:
        db.delete(teacher)
        db.commit()
