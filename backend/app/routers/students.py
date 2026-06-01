"""CRUD de estudiantes (admin) con enrollments anidados y consistencia de estado."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.student import Student
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.schemas.crm import StudentCreate, StudentOut, EnrollmentBrief

router = APIRouter(prefix="/api/admin/students", tags=["admin:students"],
                   dependencies=[Depends(require_admin)])


def _build_out(student: Student) -> StudentOut:
    """Construye StudentOut enriquecido con nombre del curso en cada enrollment."""
    briefs = []
    for e in student.enrollments:
        name = e.course.name if e.course else None
        briefs.append(EnrollmentBrief(
            id=e.id, course_id=e.course_id, course_name=name,
            status=e.status, enroll_date=e.enroll_date,
        ))
    data = StudentOut.model_validate(student)
    data.enrollments = briefs
    return data


@router.get("", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db), status: str | None = None):
    q = db.query(Student).options(
        joinedload(Student.enrollments).joinedload(Enrollment.course)
    )
    if status:
        q = q.filter(Student.status == status)
    return [_build_out(s) for s in q.order_by(Student.created_at.desc()).all()]


@router.post("", response_model=StudentOut, status_code=201)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return _build_out(student)


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).options(
        joinedload(Student.enrollments).joinedload(Enrollment.course)
    ).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Estudiante no encontrado")
    return _build_out(student)


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentCreate, db: Session = Depends(get_db)):
    student = db.query(Student).options(
        joinedload(Student.enrollments).joinedload(Enrollment.course)
    ).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Estudiante no encontrado")
    old_status = student.status
    for k, v in payload.model_dump().items():
        setattr(student, k, v)
    # Consistencia: si pasa a baja, desactivar inscripciones activas
    if payload.status == "baja" and old_status != "baja":
        for e in student.enrollments:
            if e.status == "activo":
                e.status = "baja"
    db.commit()
    db.refresh(student)
    return _build_out(student)


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if student:
        db.delete(student)
        db.commit()


# ── Endpoints de inscripciones de un estudiante ─────────────────────────────

@router.post("/{student_id}/enrollments", response_model=StudentOut, status_code=201)
def add_enrollment(student_id: int, course_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).options(
        joinedload(Student.enrollments).joinedload(Enrollment.course)
    ).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Estudiante no encontrado")
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(404, "Curso no encontrado")
    # Evitar duplicado activo
    existing = next((e for e in student.enrollments
                     if e.course_id == course_id and e.status == "activo"), None)
    if existing:
        raise HTTPException(400, "El estudiante ya está inscrito en este curso")
    db.add(Enrollment(student_id=student_id, course_id=course_id,
                      enroll_date=date.today(), status="activo"))
    # Si el estudiante estaba en 'interesado', pasa a 'inscrito'
    if student.status == "interesado":
        student.status = "inscrito"
    db.commit()
    db.refresh(student)
    return _build_out(student)


@router.delete("/{student_id}/enrollments/{enrollment_id}", response_model=StudentOut)
def remove_enrollment(student_id: int, enrollment_id: int, db: Session = Depends(get_db)):
    e = db.get(Enrollment, enrollment_id)
    if not e or e.student_id != student_id:
        raise HTTPException(404, "Inscripción no encontrada")
    e.status = "baja"
    db.commit()
    student = db.query(Student).options(
        joinedload(Student.enrollments).joinedload(Enrollment.course)
    ).filter(Student.id == student_id).first()
    return _build_out(student)
