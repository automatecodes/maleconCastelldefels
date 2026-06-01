"""Tests de las rutas admin: cursos, profesores, estudiantes, eventos."""
from datetime import date


class TestAdminRequiresAuth:
    """Todos los endpoints admin deben rechazar peticiones sin token."""
    def test_courses_requires_auth(self, client):
        assert client.get("/api/admin/courses").status_code == 401

    def test_students_requires_auth(self, client):
        assert client.get("/api/admin/students").status_code == 401

    def test_teachers_requires_auth(self, client):
        assert client.get("/api/admin/teachers").status_code == 401

    def test_events_requires_auth(self, client):
        assert client.get("/api/admin/events").status_code == 401


class TestAdminCourses:
    def test_list_courses_empty(self, client, auth_headers):
        resp = client.get("/api/admin/courses", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_course(self, client, auth_headers, sample_teacher):
        payload = {
            "slug": "merengue-test",
            "name": "Merengue Test",
            "level": "Inicio",
            "style": "Merengue",
            "price": "33",
            "trial_price": "0",
            "status": "abierto",
            "featured": False,
            "capacity": 20,
            "teacher_ids": [sample_teacher.id],
        }
        resp = client.post("/api/admin/courses", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["slug"] == "merengue-test"
        assert len(data["teachers"]) == 1

    def test_update_course(self, client, auth_headers, sample_course):
        payload = {
            "slug": sample_course.slug,
            "name": "Salsa Actualizada",
            "level": "Intermedio",
            "style": "Salsa",
            "price": "40",
            "trial_price": "0",
            "status": "abierto",
            "featured": False,
            "capacity": 15,
            "teacher_ids": [],
        }
        resp = client.put(
            f"/api/admin/courses/{sample_course.id}", json=payload, headers=auth_headers
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Salsa Actualizada"
        assert resp.json()["level"] == "Intermedio"

    def test_delete_course(self, client, auth_headers, sample_course):
        resp = client.delete(
            f"/api/admin/courses/{sample_course.id}", headers=auth_headers
        )
        assert resp.status_code == 204
        resp2 = client.get("/api/admin/courses", headers=auth_headers)
        assert resp2.json() == []


class TestAdminTeachers:
    def test_list_teachers(self, client, auth_headers, sample_teacher):
        resp = client.get("/api/admin/teachers", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_create_teacher(self, client, auth_headers):
        payload = {
            "slug": "nuevo-prof",
            "full_name": "Nuevo Profesor",
            "specialties": "Salsa",
            "is_active": True,
        }
        resp = client.post("/api/admin/teachers", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["slug"] == "nuevo-prof"

    def test_cannot_deactivate_teacher_with_courses(self, client, auth_headers, sample_course, sample_teacher):
        payload = {
            "slug": sample_teacher.slug,
            "full_name": sample_teacher.full_name,
            "is_active": False,
        }
        resp = client.put(
            f"/api/admin/teachers/{sample_teacher.id}", json=payload, headers=auth_headers
        )
        assert resp.status_code == 400
        assert "desactivar" in resp.json()["detail"].lower()

    def test_assign_courses_to_teacher(self, client, auth_headers, sample_teacher, sample_course):
        payload = {"course_ids": [sample_course.id]}
        resp = client.put(
            f"/api/admin/teachers/{sample_teacher.id}/courses",
            json=payload,
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert len(resp.json()["courses"]) == 1


class TestAdminStudents:
    def test_list_students_empty(self, client, auth_headers):
        resp = client.get("/api/admin/students", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_student(self, client, auth_headers):
        payload = {
            "first_name": "Carlos",
            "last_name": "López",
            "email": "carlos@test.com",
            "status": "interesado",
            "lead_source": "web",
        }
        resp = client.post("/api/admin/students", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["first_name"] == "Carlos"
        assert data["status"] == "interesado"
        assert data["enrollments"] == []

    def test_filter_students_by_status(self, client, auth_headers, sample_student):
        resp = client.get(
            "/api/admin/students?status=interesado", headers=auth_headers
        )
        assert len(resp.json()) == 1

        resp2 = client.get(
            "/api/admin/students?status=baja", headers=auth_headers
        )
        assert resp2.json() == []

    def test_student_status_valid_values(self, client, auth_headers):
        for status in ("inscrito", "interesado", "graduado", "baja"):
            payload = {
                "first_name": f"Test {status}",
                "status": status,
                "lead_source": "web",
            }
            resp = client.post("/api/admin/students", json=payload, headers=auth_headers)
            assert resp.status_code == 201, f"Falló para status={status}"


class TestStudentEnrollments:
    def test_enroll_student_in_course(self, client, auth_headers, sample_student, sample_course):
        resp = client.post(
            f"/api/admin/students/{sample_student.id}/enrollments?course_id={sample_course.id}",
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert len(data["enrollments"]) == 1
        assert data["enrollments"][0]["course_name"] == "Salsa Test"
        # El status debe pasar de interesado a inscrito
        assert data["status"] == "inscrito"

    def test_cannot_enroll_twice(self, client, auth_headers, sample_student, sample_course):
        client.post(
            f"/api/admin/students/{sample_student.id}/enrollments?course_id={sample_course.id}",
            headers=auth_headers,
        )
        resp = client.post(
            f"/api/admin/students/{sample_student.id}/enrollments?course_id={sample_course.id}",
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_baja_student_deactivates_enrollments(
        self, client, auth_headers, sample_student, sample_course, db
    ):
        # Inscribir primero
        client.post(
            f"/api/admin/students/{sample_student.id}/enrollments?course_id={sample_course.id}",
            headers=auth_headers,
        )
        # Poner en baja
        payload = {
            "first_name": sample_student.first_name,
            "status": "baja",
            "lead_source": sample_student.lead_source or "web",
        }
        resp = client.put(
            f"/api/admin/students/{sample_student.id}", json=payload, headers=auth_headers
        )
        assert resp.status_code == 200
        # Verificar que el enrollment también está en baja
        from app.models.enrollment import Enrollment
        db.expire_all()
        enrollment = db.query(Enrollment).filter_by(student_id=sample_student.id).first()
        assert enrollment.status == "baja"


class TestAdminEvents:
    def test_create_event_auto_status(self, client, auth_headers):
        payload = {
            "slug": "fiesta-futura",
            "name": "Fiesta Futura",
            "date": "2099-12-31",
            "status": "próximo",
        }
        resp = client.post("/api/admin/events", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["computed_status"] == "próximo"

    def test_past_event_auto_historico(self, client, auth_headers):
        payload = {
            "slug": "fiesta-pasada",
            "name": "Fiesta Pasada",
            "date": "2020-01-01",
            "status": "próximo",
        }
        resp = client.post("/api/admin/events", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["computed_status"] == "histórico"


class TestAdminLeads:
    def test_list_leads(self, client, auth_headers):
        # Crear un lead vía contacto público
        client.post("/api/public/contact", json={
            "name": "Lead Prueba", "consent": True,
            "source": "web", "preferred_channel": "whatsapp",
        })
        resp = client.get("/api/admin/leads", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_convert_lead_to_student(self, client, auth_headers):
        # Crear lead
        resp = client.post("/api/public/contact", json={
            "name": "Juan García", "email": "juan@test.com",
            "consent": True, "source": "web", "preferred_channel": "email",
        })
        lead_id = resp.json()["lead_id"]

        # Convertir
        resp2 = client.post(
            f"/api/admin/leads/{lead_id}/convert", headers=auth_headers
        )
        assert resp2.status_code == 200
        data = resp2.json()
        assert data["first_name"] == "Juan"
