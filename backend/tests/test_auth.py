"""Tests de autenticación y rate limiting."""
import pytest


class TestLogin:
    def test_login_success(self, client, admin_user):
        resp = client.post(
            "/api/auth/login",
            data={"username": admin_user.email, "password": "adminpass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, admin_user):
        resp = client.post(
            "/api/auth/login",
            data={"username": admin_user.email, "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    def test_login_unknown_email(self, client):
        resp = client.post(
            "/api/auth/login",
            data={"username": "noexiste@test.com", "password": "algo"},
        )
        assert resp.status_code == 401

    def test_login_inactive_user(self, client, db, admin_user):
        admin_user.is_active = False
        db.commit()
        resp = client.post(
            "/api/auth/login",
            data={"username": admin_user.email, "password": "adminpass123"},
        )
        assert resp.status_code == 403

    def test_rate_limit_blocks_after_5_attempts(self, client, admin_user):
        """El 6º intento fallido desde la misma IP debe devolver 429."""
        for i in range(5):
            client.post(
                "/api/auth/login",
                data={"username": admin_user.email, "password": f"wrong_{i}"},
            )
        resp = client.post(
            "/api/auth/login",
            data={"username": admin_user.email, "password": "wrong_6"},
        )
        assert resp.status_code == 429
        assert "Retry-After" in resp.headers


class TestMe:
    def test_me_requires_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_me_returns_user(self, client, auth_headers, admin_user):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == admin_user.email
        assert data["role"] == "admin"

    def test_me_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer token.falso.xxx"})
        assert resp.status_code == 401
