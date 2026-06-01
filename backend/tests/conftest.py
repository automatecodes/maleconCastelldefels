"""Fixtures compartidos para todos los tests.

Las variables de entorno se fijan ANTES de importar cualquier módulo de la app,
para que SQLAlchemy use SQLite en memoria en lugar de PostgreSQL.
"""
import os

os.environ.update({
    "DATABASE_URL": "sqlite://",          # SQLite en-memoria, sin PostgreSQL
    "JWT_SECRET": "test-secret-key-para-tests",
    "ADMIN_EMAIL": "admin@test.com",
    "ADMIN_PASSWORD": "adminpass123",
    "ADMIN2_EMAIL": "",
    "ADMIN2_PASSWORD": "",
    "IMAGE_AI_PROVIDER": "",
    "ANTHROPIC_API_KEY": "",
    "MEDIA_ROOT": "/tmp/malecon_test_media",
})

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

# Importar aquí para que usen el DATABASE_URL ya fijado
from app.core.database import Base, engine, SessionLocal, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    """Crea y destruye el esquema completo en cada test (aislamiento total)."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Limpia el rate limiter entre tests para evitar contaminación."""
    from app.routers.auth import _reset_attempts
    _reset_attempts()
    yield
    _reset_attempts()


@pytest.fixture
def db(fresh_db):
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """TestClient con la sesión de test inyectada."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# ── Fixtures de datos ─────────────────────────────────────────────────────────

@pytest.fixture
def admin_user(db):
    from app.core.security import get_password_hash
    from app.models.user import User
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("adminpass123"),
        full_name="Admin Test",
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    resp = client.post(
        "/api/auth/login",
        data={"username": admin_user.email, "password": "adminpass123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def sample_teacher(db):
    from app.models.teacher import Teacher
    t = Teacher(slug="prof-test", full_name="Profe Test", is_active=True)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@pytest.fixture
def sample_course(db, sample_teacher):
    from app.models.course import Course
    c = Course(
        slug="salsa-test",
        name="Salsa Test",
        level="Inicio",
        style="Salsa",
        price=33,
        trial_price=12.5,
        status="abierto",
        featured=True,
        capacity=20,
    )
    db.add(c)
    db.commit()
    c.teachers = [sample_teacher]
    db.commit()
    db.refresh(c)
    return c


@pytest.fixture
def sample_student(db):
    from app.models.student import Student
    s = Student(
        first_name="Ana",
        last_name="García",
        email="ana@test.com",
        phone="600000001",
        status="interesado",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
