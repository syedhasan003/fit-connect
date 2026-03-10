from pydantic import BaseModel
from typing import Optional, List


class DiscoveryGymOut(BaseModel):
    id:                  int
    place_id:            Optional[str]   = None
    name:                str
    address:             Optional[str]   = None
    lat:                 Optional[float] = None
    lng:                 Optional[float] = None

    # ── Marketplace fields ─────────────────────────────────────────────────
    category:            str             = "gym"
    # gym | turf | swimming | yoga | boxing | cricket | football | badminton | squash | trainer

    chain_name:          Optional[str]   = None
    # e.g. "Cult.fit" — set for all branches of a known chain

    is_sponsored:        bool            = False
    # Outlet has paid for boosted placement
    sponsored_rank:      int             = 9999
    # Lower = appears earlier in sponsored section

    # ── Google Places data ─────────────────────────────────────────────────
    rating:              Optional[float] = None
    user_ratings_total:  Optional[int]   = None
    price_level:         Optional[int]   = None   # 0-4
    open_now:            Optional[bool]  = None
    photo_references:    List[str]       = []

    # ── Internal metrics ───────────────────────────────────────────────────
    visit_count:         int             = 0
    distance_km:         Optional[float] = None

    # ── Tags (filter chips) ────────────────────────────────────────────────
    tags:                List[str]       = []

    # ── Amenities ──────────────────────────────────────────────────────────
    is_24_7:             bool            = False
    has_trainers:        bool            = False
    has_sauna:           bool            = False
    has_pool:            bool            = False
    has_parking:         bool            = False
    is_premium:          bool            = False
    is_claimed:          bool            = False

    class Config:
        from_attributes = True


class GymDetailOut(DiscoveryGymOut):
    """Full detail view — includes description, phone, website, opening hours."""
    description:   Optional[str]  = None
    phone_number:  Optional[str]  = None
    website:       Optional[str]  = None
    opening_hours: dict           = {}


class FeaturedGymOut(DiscoveryGymOut):
    featured_reason: str


class DiscoveryFilterParams(BaseModel):
    is_24_7:         Optional[bool]  = None
    has_trainers:    Optional[bool]  = None
    has_sauna:       Optional[bool]  = None
    has_pool:        Optional[bool]  = None
    is_premium:      Optional[bool]  = None
    open_now:        Optional[bool]  = None
    category:        Optional[str]   = None
    max_distance_km: Optional[float] = None
    sort_by:         str             = "distance"
