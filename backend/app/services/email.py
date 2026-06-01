"""Envío de email vía SMTP (Gmail por defecto, cambiable por .env)."""
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def send_email(subject: str, body: str, to: str | None = None) -> bool:
    """Envía un email. Si SMTP no está configurado, no falla (modo desarrollo)."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[email:skip] SMTP no configurado. Asunto: {subject}")
        return False
    recipient = to or settings.SMTP_FROM or settings.SMTP_USER
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = recipient
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[email:error] {exc}")
        return False
