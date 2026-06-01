"""Ajustes del sitio: almacén clave/valor para configuración editable desde el admin."""
from sqlalchemy import Column, String

from app.core.database import Base


class SiteSetting(Base):
    __tablename__ = "site_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=True)
