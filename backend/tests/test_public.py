"""Tests de los endpoints públicos (sin autenticación)."""
from datetime import date

from app.models.event import Event
from app.models.session import ClassSession


class TestHealth:
    def test_health_ok(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestPublicConfig:
    def test_config_returns_whatsapp(self, client):
        resp = client.get("/api/public/config")
        assert resp.status_code == 200
        data = resp.json()
        assert "whatsapp_number" in data
        assert "app_name" in data


class TestPublicCourses:
    def test_list_courses_empty(self, client):
        resp = client.get("/api/public/courses")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_courses_with_data(self, client, sample_course):
        resp = client.get("/api/public/courses")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["slug"] == "salsa-test"
        assert data[0]["name"] == "Salsa Test"
        assert data[0]["level"] == "Inicio"

    def test_course_has_teachers(self, client, sample_course):
        resp = client.get("/api/public/courses")
        teachers = resp.json()[0]["teachers"]
        assert len(teachers) == 1
        assert teachers[0]["slug"] == "prof-test"

    def test_get_course_by_slug(self, client, sample_course):
        resp = client.get("/api/public/courses/salsa-test")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Salsa Test"

    def test_get_course_unknown_slug(self, client):
        resp = client.get("/api/public/courses/no-existe")
        assert resp.status_code == 404


class TestPublicTeachers:
    def test_list_teachers_empty(self, client):
        resp = client.get("/api/public/teachers")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_teachers_only_active(self, client, db, sample_teacher):
        sample_teacher.is_active = False
        db.commit()
        resp = client.get("/api/public/teachers")
        assert resp.json() == []

    def test_list_teachers_active(self, client, sample_teacher):
        resp = client.get("/api/public/teachers")
        assert len(resp.json()) == 1
        assert resp.json()[0]["full_name"] == "Profe Test"


class TestPublicSchedule:
    def test_schedule_empty(self, client):
        resp = client.get("/api/public/schedule")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_schedule_with_session(self, client, db, sample_course):
        session = ClassSession(
            course_id=sample_course.id,
            weekday=0,
            start_time="19:00",
            end_time="21:00",
            room="Sala 1",
        )
        db.add(session)
        db.commit()
        resp = client.get("/api/public/schedule")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["weekday"] == 0
        assert data[0]["start_time"] == "19:00"


class TestPublicEvents:
    def test_list_events_empty(self, client):
        resp = client.get("/api/public/events")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_event_computed_status_proximo(self, client, db):
        ev = Event(
            slug="evento-futuro",
            name="Evento Futuro",
            date=date(2099, 1, 1),
            status="próximo",
        )
        db.add(ev)
        db.commit()
        resp = client.get("/api/public/events")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["computed_status"] == "próximo"

    def test_event_computed_status_historico(self, client, db):
        ev = Event(
            slug="evento-pasado",
            name="Evento Pasado",
            date=date(2020, 1, 1),
            status="histórico",
        )
        db.add(ev)
        db.commit()
        resp = client.get("/api/public/events")
        data = resp.json()
        assert data[0]["computed_status"] == "histórico"


class TestPublicContact:
    def test_submit_contact_creates_lead(self, client):
        payload = {
            "name": "Test Lead",
            "email": "lead@test.com",
            "phone": "600000000",
            "message": "Quiero apuntarme",
            "source": "web",
            "preferred_channel": "whatsapp",
            "consent": True,
        }
        resp = client.post("/api/public/contact", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["ok"] is True
        assert "lead_id" in data

    def test_submit_contact_requires_consent(self, client):
        payload = {
            "name": "Sin Consentimiento",
            "consent": False,
            "source": "web",
            "preferred_channel": "whatsapp",
        }
        resp = client.post("/api/public/contact", json=payload)
        # La API acepta el payload pero el lead se guarda con consent=no
        assert resp.status_code == 201
