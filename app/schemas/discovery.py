from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DiscoveryGymOut(BaseModel):
    id: int
    name: str
    address: Optional[str]
    cover_image_url: Optional[str]
    lat: Optional[float]
    lng: Optional[float]

    visit_count: int = 0

    class Config:
        from_attributes = True


class FeaturedGymOut(DiscoveryGymOut):
    featured_reason: str
