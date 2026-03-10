"""
discovery.py — Gym Discovery endpoints
───────────────────────────────────────
GET  /discovery/gyms          — main feed (Places-backed, cached in DB)
GET  /discovery/gyms/{gym_id} — single gym detail with full Places data
GET  /discovery/photo         — server-side photo proxy (hides API key from client)
GET  /discovery/featured      — trending gyms (most visited this week)

Flow:
  1. Client sends lat/lng + filters
  2. Backend checks DB cache (< 24h, >= 5 gyms near this area)
  3. If stale/empty → calls Google Places Nearby Search → upserts gyms
  4. Queries DB and returns typed response

Photo proxy:
  Client requests /discovery/photo?ref=<photo_reference>&maxwidth=400
  Backend fetches from Google and streams back the image bytes.
  This keeps the API key server-side.
"""

import logging
import math
import os
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.gym import Gym
from app.models.gym_amenities import GymAmenities
from app.models.visit import Visit
from app.schemas.discovery import DiscoveryGymOut, FeaturedGymOut, GymDetailOut
from app.services.places import (
    search_nearby_gyms,
    get_place_details,
    upsert_gym_from_place,
    area_needs_sync,
    PLACES_API_KEY,
    PLACE_PHOTO_URL,
)
from app.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discovery", tags=["Discovery"])

# Default fallback city: Chennai (used when no lat/lng provided)
DEFAULT_LAT = 13.0827
DEFAULT_LNG = 80.2707


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance between two coordinates in km (Haversine formula)."""
    if not all([lat1, lng1, lat2, lng2]):
        return None
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _build_gym_out(gym: Gym, amenities: Optional[GymAmenities],
                   visit_count: int, user_lat: Optional[float],
                   user_lng: Optional[float]) -> DiscoveryGymOut:
    """Assemble a DiscoveryGymOut from ORM rows."""
    distance_km = None
    if user_lat and user_lng and gym.lat and gym.lng:
        distance_km = round(_haversine(user_lat, user_lng, gym.lat, gym.lng), 2)

    # Build tag list for frontend filter chips
    tags = []
    if amenities:
        if amenities.is_premium:   tags.append("Premium")
        if amenities.is_24_7:      tags.append("24x7")
        if amenities.has_trainers: tags.append("Trainers")
        if amenities.has_sauna:    tags.append("Sauna")
        if amenities.has_pool:     tags.append("Pool")
        if amenities.has_parking:  tags.append("Parking")

    # Open-now from cached hours
    open_now = None
    if gym.opening_hours_json:
        open_now = gym.opening_hours_json.get("open_now")

    return DiscoveryGymOut(
        id=gym.id,
        place_id=gym.place_id,
        name=gym.name,
        address=gym.address,
        lat=gym.lat,
        lng=gym.lng,
        # marketplace fields
        category=gym.category or "gym",
        chain_name=gym.chain_name,
        is_sponsored=gym.is_sponsored or False,
        sponsored_rank=gym.sponsored_rank or 9999,
        # places data
        rating=gym.rating,
        user_ratings_total=gym.user_ratings_total,
        price_level=gym.price_level,
        open_now=open_now,
        visit_count=visit_count or 0,
        distance_km=distance_km,
        tags=tags,
        photo_references=gym.photo_references_json or [],
        is_claimed=gym.is_claimed or False,
        is_24_7=amenities.is_24_7 if amenities else False,
        has_trainers=amenities.has_trainers if amenities else False,
        has_sauna=amenities.has_sauna if amenities else False,
        has_pool=amenities.has_pool if amenities else False,
        has_parking=amenities.has_parking if amenities else False,
        is_premium=amenities.is_premium if amenities else False,
    )


async def _sync_area_if_needed(db: Session, lat: float, lng: float,
                                radius_m: int = 3000) -> None:
    """If the area cache is stale, fetch from Places and upsert into DB."""
    if not area_needs_sync(db, lat, lng):
        return

    logger.info(f"[Discovery] Syncing area ({lat:.4f},{lng:.4f}) from Places API")
    places = await search_nearby_gyms(lat, lng, radius_m)

    for place in places:
        try:
            upsert_gym_from_place(db, place, details=None)
        except Exception as e:
            logger.warning(f"[Discovery] Upsert failed for {place.get('place_id')}: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# GET /discovery/gyms — main feed
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/gyms", response_model=List[DiscoveryGymOut])
async def discover_gyms(
    user_lat:       Optional[float] = Query(None),
    user_lng:       Optional[float] = Query(None),
    radius_km:      float           = Query(5.0),
    is_24_7:        Optional[bool]  = Query(None),
    has_trainers:   Optional[bool]  = Query(None),
    has_sauna:      Optional[bool]  = Query(None),
    is_premium:     Optional[bool]  = Query(None),
    has_pool:       Optional[bool]  = Query(None),
    open_now:       Optional[bool]  = Query(None),
    category:       Optional[str]   = Query(None),   # gym | turf | swimming | yoga | ...
    sponsored_only: Optional[bool]  = Query(None),   # True = sponsored feed only
    sort_by:        str             = Query("distance"),   # distance | popular | newest | sponsored
    limit:          int             = Query(30),
    db:             Session         = Depends(get_db),
    current_user                    = Depends(get_current_user),
):
    """
    Main discovery feed.
    Auto-syncs with Google Places when the local cache is stale.
    """
    lat = user_lat or DEFAULT_LAT
    lng = user_lng or DEFAULT_LNG

    # 1. Populate cache from Places if needed
    await _sync_area_if_needed(db, lat, lng, radius_m=int(radius_km * 1000))

    # 2. Query DB with amenity filters
    query = (
        db.query(Gym, GymAmenities, func.count(Visit.id).label("visit_count"))
        .outerjoin(GymAmenities, GymAmenities.gym_id == Gym.id)
        .outerjoin(Visit, Visit.gym_id == Gym.id)
        .filter(Gym.lat.isnot(None), Gym.lng.isnot(None))
        .group_by(Gym.id, GymAmenities.id)
    )

    if is_24_7 is not None:
        query = query.filter(GymAmenities.is_24_7 == is_24_7)
    if has_trainers is not None:
        query = query.filter(GymAmenities.has_trainers == has_trainers)
    if has_sauna is not None:
        query = query.filter(GymAmenities.has_sauna == has_sauna)
    if is_premium is not None:
        query = query.filter(GymAmenities.is_premium == is_premium)
    if has_pool is not None:
        query = query.filter(GymAmenities.has_pool == has_pool)
    if category is not None:
        query = query.filter(Gym.category == category)
    if sponsored_only:
        query = query.filter(Gym.is_sponsored == True)

    if sort_by == "sponsored":
        query = query.order_by(Gym.sponsored_rank.asc())
    elif sort_by == "newest":
        query = query.order_by(Gym.created_at.desc())
    elif sort_by == "popular":
        query = query.order_by(func.count(Visit.id).desc())
    # distance sorting handled in Python below

    results = query.limit(limit * 3).all()  # over-fetch for distance trim

    # 3. Build response, apply radius + open_now filter, sort by distance
    gym_list = []
    for gym, amenities, visit_count in results:
        dist = _haversine(lat, lng, gym.lat, gym.lng)
        if dist is not None and dist > radius_km:
            continue

        # open_now filter
        if open_now is not None and gym.opening_hours_json:
            cached_open = gym.opening_hours_json.get("open_now")
            if cached_open is not None and cached_open != open_now:
                continue

        gym_out = _build_gym_out(gym, amenities, visit_count, lat, lng)
        gym_list.append(gym_out)

    if sort_by == "distance":
        gym_list.sort(key=lambda g: g.distance_km if g.distance_km is not None else 9999)

    return gym_list[:limit]


# ─────────────────────────────────────────────────────────────────────────────
# GET /discovery/gyms/{gym_id} — single gym detail
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/gyms/{gym_id}", response_model=GymDetailOut)
async def get_gym_detail(
    gym_id:      int,
    user_lat:    Optional[float] = Query(None),
    user_lng:    Optional[float] = Query(None),
    db:          Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Full gym detail. If the gym's Place Details have never been fetched (no phone/hours),
    fetches them now and caches them.
    """
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")

    # Enrich with Place Details if we have a place_id and phone is missing
    if gym.place_id and not gym.phone_number:
        logger.info(f"[Discovery] Fetching Place Details for gym {gym_id}")
        details = await get_place_details(gym.place_id)
        if details:
            upsert_gym_from_place(db, {"place_id": gym.place_id}, details=details)
            db.refresh(gym)

    amenities = db.query(GymAmenities).filter(GymAmenities.gym_id == gym.id).first()
    visit_count = db.query(func.count(Visit.id)).filter(Visit.gym_id == gym.id).scalar() or 0

    gym_out = _build_gym_out(gym, amenities, visit_count, user_lat, user_lng)

    return GymDetailOut(
        **gym_out.dict(),
        description=gym.description,
        phone_number=gym.phone_number,
        website=gym.website,
        opening_hours=gym.opening_hours_json or {},
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /discovery/photo — server-side photo proxy
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/photo")
async def get_gym_photo(
    ref:      str = Query(..., description="Google Places photo_reference"),
    maxwidth: int = Query(800, ge=100, le=1600),
    current_user = Depends(get_current_user),
):
    """
    Proxies a Google Places photo so the API key stays server-side.
    Frontend calls: /discovery/photo?ref=<photo_reference>&maxwidth=400
    """
    if not PLACES_API_KEY:
        raise HTTPException(status_code=503, detail="Places API key not configured")

    url = f"{PLACE_PHOTO_URL}?photoreference={ref}&maxwidth={maxwidth}&key={PLACES_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        content_type = resp.headers.get("content-type", "image/jpeg")
        return Response(
            content=resp.content,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=86400"},  # cache 24h in browser
        )

    except httpx.HTTPError as e:
        logger.error(f"[Photo proxy] HTTP error: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch photo")


# ─────────────────────────────────────────────────────────────────────────────
# GET /discovery/chains — chain brands near user
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/chains")
async def nearby_chains(
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    radius_km: float          = Query(10.0),
    db: Session               = Depends(get_db),
    current_user              = Depends(get_current_user),
):
    """
    Returns a list of chains (brands) that have at least 1 branch near the user.
    Each entry includes: chain_name, branch_count, avg_rating, nearest branch info.
    """
    lat = user_lat or DEFAULT_LAT
    lng = user_lng or DEFAULT_LNG

    gyms = db.query(Gym).filter(
        Gym.chain_name.isnot(None),
        Gym.lat.isnot(None),
        Gym.lng.isnot(None),
    ).all()

    # Group by chain, filter by radius
    chains: dict[str, dict] = {}
    for gym in gyms:
        dist = _haversine(lat, lng, gym.lat, gym.lng)
        if dist is None or dist > radius_km:
            continue

        chain = gym.chain_name
        if chain not in chains:
            chains[chain] = {
                "chain_name":    chain,
                "branch_count":  0,
                "total_rating":  0.0,
                "rated_count":   0,
                "nearest_km":    dist,
                "nearest_name":  gym.name,
                "nearest_id":    gym.id,
                "nearest_addr":  gym.address,
                "category":      gym.category or "gym",
            }

        c = chains[chain]
        c["branch_count"] += 1
        if gym.rating:
            c["total_rating"] += gym.rating
            c["rated_count"]  += 1
        if dist < c["nearest_km"]:
            c["nearest_km"]   = dist
            c["nearest_name"] = gym.name
            c["nearest_id"]   = gym.id
            c["nearest_addr"] = gym.address

    result = []
    for c in chains.values():
        c["avg_rating"] = round(c["total_rating"] / c["rated_count"], 1) if c["rated_count"] else None
        c["nearest_km"] = round(c["nearest_km"], 2)
        result.append(c)

    result.sort(key=lambda x: (x["nearest_km"], -(x["avg_rating"] or 0)))
    return result


# ─────────────────────────────────────────────────────────────────────────────
# GET /discovery/featured — trending this week
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/featured", response_model=List[FeaturedGymOut])
async def featured_gyms(
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    limit:    int             = Query(10),
    db:       Session         = Depends(get_db),
    current_user              = Depends(get_current_user),
):
    """Trending gyms based on visit count in the past 7 days."""
    from datetime import timedelta
    since = datetime.now(timezone.utc) - timedelta(days=7)

    query = (
        db.query(Gym, GymAmenities, func.count(Visit.id).label("visit_count"))
        .join(Visit, Visit.gym_id == Gym.id)
        .outerjoin(GymAmenities, GymAmenities.gym_id == Gym.id)
        .filter(Visit.created_at >= since)
        .group_by(Gym.id, GymAmenities.id)
        .order_by(func.count(Visit.id).desc())
        .limit(limit)
    )

    lat = user_lat or DEFAULT_LAT
    lng = user_lng or DEFAULT_LNG

    featured_list = []
    for gym, amenities, visit_count in query.all():
        gym_out = _build_gym_out(gym, amenities, visit_count, lat, lng)
        dist = gym_out.distance_km

        if dist and dist < 2:
            reason = f"Trending near you · {dist:.1f} km away"
        elif visit_count > 50:
            reason = f"Most popular · {visit_count} visits this week"
        else:
            reason = "Trending in your area"

        featured_list.append(FeaturedGymOut(**gym_out.dict(), featured_reason=reason))

    return featured_list
