from pydantic import BaseModel
from typing import Optional, List, Any


class DiscoveryGymOut(BaseModel):
    id:                  int
    place_id:            Optional[str]   = None
    name:                str
    address:             Optional[str]   = None
    lat:                 Optional[float] = None
    lng:                 Optional[float] = None

    # Google Places data
    rating:              Optional[float] = None
    user_ratings_total:  Optional[int]   = None
    price_level:         Optional[int]   = None   # 0-4
    open_now:            Optional[bool]  = None
    photo_references:    List[str]       = []      # photo_reference strings → /discovery/photo proxy

    # Internal metrics
    visit_count:         int             = 0
    distance_km:         Optional[float] = None

    # Derived tag list (for filter chips on frontend)
    tags:                List[str]       = []

    # Amenities (booleans)
    is_24_7:             bool            = False
    has_trainers:        bool            = False
    has_sauna:           bool            = False
    has_pool:            bool            = False
    has_parking:         bool            = False
    is_premium:          bool            = False

    is_claimed:          bool            = False   # gym owner has verified listing

    class Config:
        from_attributes = True


class GymDetailOut(DiscoveryGymOut):
    """Full detail view — includes description, phone, website, opening hours."""
    description:   Optional[str]  = None
    phone_number:  Optional[str]  = None
    website:       Optional[str]  = None
    opening_hours: dict           = {}   # {"weekday_text": [...], "open_now": bool}


class FeaturedGymOut(DiscoveryGymOut):
    featured_reason: str


class DiscoveryFilterParams(BaseModel):
    is_24_7:         Optional[bool]  = None
    has_trainers:    Optional[bool]  = None
    has_sauna:       Optional[bool]  = None
    has_pool:        Optional[bool]  = None
    is_premium:      Optional[bool]  = None
    open_now:        Optional[bool]  = None
    max_distance_km: Optional[float] = None
    sort_by:         str             = "distance"
