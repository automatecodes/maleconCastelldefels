"""Dependencias de autenticación para rutas protegidas del admin."""
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

# auto_error=False → no lanza 401 si no hay header Bearer; permite usar cookie como fallback
_oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    bearer: str | None = Depends(_oauth2_optional),
    db: Session = Depends(get_db),
) -> User:
    # Prioridad: cookie HttpOnly → Bearer token (Swagger / API clients)
    token = request.cookies.get("token") or bearer
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales no válidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exc
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise credentials_exc
    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user or not user.is_active:
        raise credentials_exc
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return user
