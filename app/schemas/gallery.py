from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GalleryItemOut(BaseModel):
    id: int
    gym_id: int
    file_url: str
    media_type: str
    created_at: datetime

    class Config:
        from_attributes = True
