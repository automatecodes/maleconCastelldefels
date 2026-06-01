"""CRUD de cursos (admin) con gestión de profesores e inscripciones."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.course import Course
from app.models.teacher import Teacher
from app.models.enrollment import Enrollment
from app.models.student import Student
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


@router.get("/{course_id}/students")
def list_course_students(course_id: int, db: Session = Depends(get_db)):
    """Estudiantes inscritos activamente en un curso."""
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.course_id == course_id, Enrollment.status == "activo")
        .all()
    )
    return [
        {
            "enrollment_id": e.id,
            "student_id": e.student.id,
            "full_name": f"{e.student.first_name} {e.student.last_name or ''}".strip(),
            "email": e.student.email,
            "phone": e.student.phone,
            "status": e.status,
            "enroll_date": e.enroll_date,
        }
        for e in enrollments if e.student
    ]


@router.post("/{course_id}/students/{student_id}", status_code=201)
def enroll_student_in_course(course_id: int, student_id: int, db: Session = Depends(get_db)):
    """Inscribe un estudiante en un curso desde la vista de curso."""
    course = db.get(Course, course_id)
    student = db.get(Student, student_id)
    if not course:
        raise HTTPException(404, "Curso no encontrado")
    if not student:
        raise HTTPException(404, "Estudiante no encontrado")
    existing = db.query(Enrollment).filter_by(
        course_id=course_id, student_id=student_id, status="activo"
    ).first()
    if existing:
        raise HTTPException(400, "Ya inscrito")
    db.add(Enrollment(student_id=student_id, course_id=course_id,
                      enroll_date=date.today(), status="activo"))
    if student.status == "interesado":
        student.status = "inscrito"
    db.commit()
    return {"enrolled": True}


@router.delete("/{course_id}/students/{student_id}")
def unenroll_student(course_id: int, student_id: int, db: Session = Depends(get_db)):
    """Da de baja la inscripción de un estudiante en un curso."""
    e = db.query(Enrollment).filter_by(
        course_id=course_id, student_id=student_id, status="activo"
    ).first()
    if not e:
        raise HTTPException(404, "Inscripción no encontrada")
    e.status = "baja"
    db.commit()
    return {"unenrolled": True}
