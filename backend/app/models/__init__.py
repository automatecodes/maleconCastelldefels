"""Importa todos los modelos para que SQLAlchemy registre las tablas."""
from app.models.user import User  # noqa: F401
from app.models.teacher import Teacher  # noqa: F401
from app.models.course import Course, course_teachers  # noqa: F401
from app.models.session import ClassSession  # noqa: F401
from app.models.student import Student  # noqa: F401
from app.models.enrollment import Enrollment  # noqa: F401
from app.models.event import Event, EventPhoto  # noqa: F401
from app.models.lead import Lead  # noqa: F401
from app.models.social import SocialPost  # noqa: F401
from app.models.consent import ConsentLog  # noqa: F401
from app.models.setting import SiteSetting  # noqa: F401
from app.models.media import MediaFile  # noqa: F401
