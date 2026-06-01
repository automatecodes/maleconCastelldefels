"""CRUD de cursos (admin)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.course import Course
from app.models.teacher import Teacher
from app.schemas.catalog import CourseCreate, CourseOut

router = APIRouter(prefix="/api/admin/courses", tags=["admin:courses"],
                   dependencies=[Depends(require_admin)])


def _apply_teachers(course: Course, teacher_ids: list[int], db: Session):
    course.teachers = db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all() if teacher_ids else []


@router.get("", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.name).all()


@router.post("", response_model=CourseOut, status_code=201)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"teacher_ids"})
    course = Course(**data)
    _apply_teachers(course, payload.teacher_ids, db)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseOut)
def update_course(course_id: int, payload: CourseCreate, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(404, "Curso no encontrado")
    for k, v in payload.model_dump(exclude={"teacher_ids"}).items():
        setattr(course, k, v)
    _apply_teachers(course, payload.teacher_ids, db)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if course:
        db.delete(course)
        db.commit()
