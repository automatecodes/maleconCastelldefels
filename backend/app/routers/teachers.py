"""CRUD de profesores (admin) con asignación de cursos y protección de desactivación."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.teacher import Teacher
from app.models.course import Course
from app.schemas.catalog import TeacherCreate, TeacherOut

router = APIRouter(prefix="/api/admin/teachers", tags=["admin:teachers"],
                   dependencies=[Depends(require_admin)])


class TeacherCourseAssign(BaseModel):
    course_ids: list[int] = []


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
    # Protección: no desactivar si tiene cursos asignados
    if not payload.is_active and teacher.is_active and teacher.courses:
        names = ", ".join(c.name for c in teacher.courses)
        raise HTTPException(
            400,
            f"No se puede desactivar al profesor porque está asignado a: {names}. "
            "Desasígnalo de los cursos primero."
        )
    for k, v in payload.model_dump().items():
        setattr(teacher, k, v)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.put("/{teacher_id}/courses", response_model=TeacherOut)
def assign_courses(teacher_id: int, payload: TeacherCourseAssign, db: Session = Depends(get_db)):
    """Reemplaza los cursos asignados a un profesor."""
    teacher = db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(404, "Profesor no encontrado")
    teacher.courses = db.query(Course).filter(Course.id.in_(payload.course_ids)).all()
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", status_code=204)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.get(Teacher, teacher_id)
    if teacher:
        if teacher.courses:
            raise HTTPException(400, "No se puede eliminar un profesor con cursos asignados.")
        db.delete(teacher)
        db.commit()
