from datetime import datetime
from pydantic import BaseModel


class SocialPostOut(BaseModel):
    id: int
    platform: str
    thumbnail_url: str | None = None
    text: str | None = None
    permalink: str
    published_at: datetime | None = None

    class Config:
        from_attributes = True
