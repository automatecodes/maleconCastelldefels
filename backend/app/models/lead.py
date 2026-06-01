"""Lead / Contacto generado desde el formulario público."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func

from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    level = Column(String, nullable=True)
    course_interest_id = Column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=True)
    preferred_channel = Column(String, default="whatsapp")
    # nuevo / contactado / convertido / descartado
    status = Column(String, default="nuevo", nullable=False)
    source = Column(String, default="web")     # web/whatsapp/redes/...
    consent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
