"""Usuario del sistema. En esta fase sólo 'admin'; preparado para 'teacher'/'student'."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    # admin (actual) · teacher / student (fases futuras, §11)
    role = Column(String, default="admin", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
