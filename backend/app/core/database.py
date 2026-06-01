"""Configuración de SQLAlchemy: engine, sesión y base declarativa."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

_url = settings.database_url
if _url.startswith("sqlite"):
    from sqlalchemy.pool import StaticPool
    # StaticPool garantiza que todas las conexiones comparten la misma BD en-memoria
    engine = create_engine(
        _url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db():
    """Dependencia FastAPI: una sesión por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
