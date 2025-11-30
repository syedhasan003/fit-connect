# app/schemas/gym.py
from pydantic import BaseModel
from typing import List, Optional

class GymBase(BaseModel):
    name: str
    city: Optional[str] = None
    locality: Optional[str] = None

    monthly_price: Optional[float] = 0.0
    yearly_price: Optional[float] = 0.0
    daily_pass_price: Optional[float] = 0.0

    description: Optional[str] = None

    amenities: Optional[List[str]] = []
    images: Optional[List[str]] = []
    gallery_images: Optional[List[str]] = []
    membership_options: Optional[List[str]] = []
    equipment_list: Optional[List[str]] = []
    classes_available: Optional[List[str]] = []

    personal_training_available: Optional[bool] = False
    is_popular: Optional[bool] = False

    rating: Optional[float] = 0.0
    review_count: Optional[int] = 0

    cover_image: Optional[str] = None
    video_url: Optional[str] = None

    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0

    # opening_hours as a dict, e.g. {"monday": "06:00-23:00", ...}
    opening_hours: Optional[dict] = {}

class GymCreate(GymBase):
    pass

class GymUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None

    monthly_price: Optional[float] = None
    yearly_price: Optional[float] = None
    daily_pass_price: Optional[float] = None

    description: Optional[str] = None

    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    gallery_images: Optional[List[str]] = None
    membership_options: Optional[List[str]] = None
    equipment_list: Optional[List[str]] = None
    classes_available: Optional[List[str]] = None

    personal_training_available: Optional[bool] = None
    is_popular: Optional[bool] = None

    rating: Optional[float] = None
    review_count: Optional[int] = None

    cover_image: Optional[str] = None
    video_url: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    opening_hours: Optional[dict] = None

class GymRead(GymBase):
    id: int

    class Config:
        from_attributes = True
