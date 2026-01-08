from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ========================
# CREATE GYM (INPUT)
# ========================
class GymCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
  
class GymUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

# ========================
# GYM OUTPUT (READ)
# ========================
class GymOut(BaseModel):
    id: int
    owner_id: int

    name: str
    description: Optional[str]
    address: Optional[str]
    lat: Optional[float]
    lng: Optional[float]

    cover_image_url: Optional[str] = None
    gallery_images: List[str] = []

    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode
