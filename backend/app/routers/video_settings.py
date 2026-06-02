from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.setting import SiteSetting

KEY_OVERLAY = "VIDEO_OVERLAY"
KEY_SPEED   = "VIDEO_SPEED"

router = APIRouter(
    prefix="/api/admin/video",
    tags=["admin:video"],
    dependencies=[Depends(require_admin)],
)
public_router = APIRouter(prefix="/api/public", tags=["public:video"])


class VideoSettings(BaseModel):
    overlay: float = 0.05   # 0.0 – 1.0  (opacidad de la capa oscura)
    speed:   float = 1.0    # 0.25 – 2.0 (velocidad de reproducción)


def _read(db: Session) -> VideoSettings:
    row_o = db.get(SiteSetting, KEY_OVERLAY)
    row_s = db.get(SiteSetting, KEY_SPEED)
    return VideoSettings(
        overlay=float(row_o.value) if row_o else 0.05,
        speed=float(row_s.value)   if row_s else 1.0,
    )


@router.get("", response_model=VideoSettings)
def get_video_settings(db: Session = Depends(get_db)):
    return _read(db)


@router.put("", response_model=VideoSettings)
def set_video_settings(payload: VideoSettings, db: Session = Depends(get_db)):
    for key, val in [(KEY_OVERLAY, payload.overlay), (KEY_SPEED, payload.speed)]:
        row = db.get(SiteSetting, key)
        if row:
            row.value = str(round(val, 4))
        else:
            db.add(SiteSetting(key=key, value=str(round(val, 4))))
    db.commit()
    return _read(db)


@public_router.get("/video-settings", response_model=VideoSettings)
def public_video_settings(db: Session = Depends(get_db)):
    return _read(db)
