"""Registro de consentimientos RGPD (formularios y cookies)."""
from sqlalchemy import Column, Integer, String, DateTime, func

from app.core.database import Base


class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id = Column(Integer, primary_key=True)
    subject = Column(String, nullable=True)    # email o identificador
    kind = Column(String, nullable=False)      # formulario / cookies
    detail = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
