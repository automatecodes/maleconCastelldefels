"""Autenticación de administración (JWT, email + contraseña) con rate limiting."""
import threading
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import Token, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Rate limiter in-memory (thread-safe) ─────────────────────────────────────
_attempts: dict[str, list[datetime]] = defaultdict(list)
_lock = threading.Lock()

_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 60


def _reset_attempts() -> None:
    """Limpia todos los contadores de intentos. Solo para tests."""
    with _lock:
        _attempts.clear()


def _rate_limit(ip: str) -> None:
    """Lanza 429 si la IP ha superado el límite de intentos en la ventana temporal."""
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=_WINDOW_SECONDS)
    with _lock:
        _attempts[ip] = [t for t in _attempts[ip] if t > cutoff]
        if len(_attempts[ip]) >= _MAX_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail=f"Demasiados intentos de acceso. Espera {_WINDOW_SECONDS} segundos.",
                headers={"Retry-After": str(_WINDOW_SECONDS)},
            )
        _attempts[ip].append(now)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else "unknown"
    _rate_limit(ip)

    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    token = create_access_token(subject=user.email, role=user.role)
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
