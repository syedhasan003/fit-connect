from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DiscoveryGymOut(BaseModel):
    """
    Enhanced gym output for discovery feed with amenities.
    """
    id: int
    name: str
    address: Optional[str] = None
    cover_image_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    
    visit_count: int = 0
    distance_km: Optional[float] = None  # Distance from user (if location provided)
    
    # Amenities
    is_24_7: bool = False
    has_trainers: bool = False
    has_sauna: bool = False
    has_pool: bool = False
    has_parking: bool = False
    is_premium: bool = False

    class Config:
        from_attributes = True


class FeaturedGymOut(DiscoveryGymOut):
    """
    Featured gym with reason for featuring.
    """
    featured_reason: str


class DiscoveryFilterParams(BaseModel):
    """
    Filter parameters for discovery search.
    """
    is_24_7: Optional[bool] = None
    has_trainers: Optional[bool] = None
    has_sauna: Optional[bool] = None
    has_pool: Optional[bool] = None
    is_premium: Optional[bool] = None
    max_distance_km: Optional[float] = None
    sort_by: str = "popular"  # popular, distance, newest