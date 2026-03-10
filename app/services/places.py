"""
places.py — Google Places API service
──────────────────────────────────────
Wraps Google Places API (new) for gym discovery.

  search_nearby_gyms(lat, lng, radius_m)  →  list of raw Place dicts
  get_place_details(place_id)              →  enriched Place dict (phone, hours, photos)
  upsert_gym_from_place(db, place)         →  create/update Gym + GymAmenities row

Uses:
  GOOGLE_PLACES_API_KEY env var (same key as YouTube — just enable Places API in GCP console)

Caching strategy:
  - A gym row is considered fresh if places_fetched_at < CACHE_TTL_HOURS old.
  - An area search is considered fresh if ≥ MIN_GYMS_CACHED_FOR_AREA gyms already exist
    near that coordinate that were fetched within the TTL.

Photo references:
  - Stored as JSON list in gym.photo_references_json.
  - Actual image bytes are served through the /discovery/photo proxy endpoint.
"""

import os
import logging
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.models.gym import Gym
from app.models.gym_amenities import GymAmenities

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

# Nearby Search endpoint (Places API legacy — well-supported, simpler response)
NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

# Place Details endpoint
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

# Photo URL — not called directly; returned for the proxy to fetch
PLACE_PHOTO_URL   = "https://maps.googleapis.com/maps/api/place/photo"

# Cache: re-fetch after this many hours
CACHE_TTL_HOURS = 24

# If this many gyms already exist near a coordinate (within ~3 km) and are fresh → skip API call
MIN_GYMS_CACHED_FOR_AREA = 5

# Fields to request from Place Details (reduces billing)
DETAILS_FIELDS = (
    "place_id,name,vicinity,formatted_address,geometry,"
    "rating,user_ratings_total,price_level,"
    "formatted_phone_number,website,"
    "opening_hours,photos,types"
)

NEARBY_FIELDS = (
    "place_id,name,vicinity,geometry,rating,"
    "user_ratings_total,price_level,photos,opening_hours,types"
)

# Timeout for external HTTP calls (seconds)
HTTP_TIMEOUT = 10

# ── Known premium chains (India-centric, case-insensitive substring match) ───
PREMIUM_CHAINS: list[tuple[str, str]] = [
    # (match_keyword, normalised_display_name)
    ("cult.fit",          "Cult.fit"),
    ("cult fit",          "Cult.fit"),
    ("curefit",           "Cult.fit"),
    ("gold's gym",        "Gold's Gym"),
    ("golds gym",         "Gold's Gym"),
    ("gold gym",          "Gold's Gym"),
    ("anytime fitness",   "Anytime Fitness"),
    ("snap fitness",      "Snap Fitness"),
    ("fitness first",     "Fitness First"),
    ("talwalkars",        "Talwalkars"),
    ("true fitness",      "True Fitness"),
    ("f45",               "F45"),
    ("crossfit",          "CrossFit"),
    ("physique 57",       "Physique 57"),
    ("powerhouse gym",    "Powerhouse Gym"),
    ("la fitness",        "LA Fitness"),
    ("pure gym",          "Pure Gym"),
    ("crunch fitness",    "Crunch Fitness"),
    ("24 hour fitness",   "24 Hour Fitness"),
    ("planet fitness",    "Planet Fitness"),
    ("nuffield",          "Nuffield Health"),
    ("vi fitness",        "Vi Fitness"),
    ("iron world",        "Iron World"),
    ("fitness one",       "Fitness One"),
    ("energy fitness",    "Energy Fitness"),
]

# ── Category keyword → category slug ─────────────────────────────────────────
CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("swimming",  ["swimming", "pool", "aquatic", "natatorium", "swim"]),
    ("yoga",      ["yoga", "pilates", "wellness center", "meditation", "zen studio"]),
    ("boxing",    ["boxing", "mma", "muay thai", "martial art", "karate",
                   "judo", "taekwondo", "kickboxing", "combat sport"]),
    ("cricket",   ["cricket"]),
    ("football",  ["football", "soccer"]),
    ("badminton", ["badminton"]),
    ("squash",    ["squash"]),
    ("turf",      ["turf", "arena", "ground", "sports complex", "sports village",
                   "sport center", "sports center"]),
    ("crossfit",  ["crossfit", "cross fit"]),
    ("trainer",   ["personal trainer", "pt studio", "coaching studio"]),
]

def _infer_category(name: str) -> str:
    """Return category slug from gym name keywords."""
    low = name.lower()
    for category, keywords in CATEGORY_KEYWORDS:
        if any(kw in low for kw in keywords):
            return category
    return "gym"

def _infer_chain(name: str) -> str | None:
    """Return normalised chain name if the gym belongs to a known chain."""
    low = name.lower()
    for keyword, display_name in PREMIUM_CHAINS:
        if keyword in low:
            return display_name
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _is_fresh(fetched_at: Optional[datetime]) -> bool:
    """Return True if the Places data was fetched within the TTL window."""
    if fetched_at is None:
        return False
    now = datetime.now(timezone.utc)
    # SQLite stores datetimes without timezone — make naive comparisons safe
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)
    return (now - fetched_at) < timedelta(hours=CACHE_TTL_HOURS)


def _infer_amenities(place: dict) -> dict:
    """
    Best-effort amenity inference from Places data.
    Google doesn't expose specific amenities, so we infer from:
      - place name keywords
      - price_level (premium if >= 3)
      - opening hours (24/7 detection)
    Gym owners can correct these after claiming their listing.
    """
    name_lower = (place.get("name") or "").lower()
    price_level = place.get("price_level") or 0

    # 24/7 detection: check if periods cover all 24 hours
    is_24_7 = False
    opening = place.get("opening_hours") or {}
    for period in opening.get("periods", []):
        if period.get("open", {}).get("time") == "0000" and "close" not in period:
            is_24_7 = True
            break

    # Keyword-based amenity hints
    has_pool    = any(w in name_lower for w in ["aqua", "pool", "swim", "olympic"])
    has_sauna   = any(w in name_lower for w in ["sauna", "steam", "spa", "luxury"])
    is_premium  = price_level >= 3 or any(
        w in name_lower for w in ["gold", "premium", "elite", "platinum", "luxury", "anytime"]
    )
    has_trainers = any(
        w in name_lower for w in ["personal", "trainer", "coach", "fitness first", "cult"]
    )

    return {
        "is_24_7":      is_24_7,
        "has_trainers": has_trainers,
        "has_sauna":    has_sauna,
        "has_pool":     has_pool,
        "is_premium":   is_premium,
        "has_parking":  False,   # can't infer — owner updates after claiming
    }


# ─────────────────────────────────────────────────────────────────────────────
# API calls
# ─────────────────────────────────────────────────────────────────────────────

async def search_nearby_gyms(lat: float, lng: float, radius_m: int = 3000) -> list[dict]:
    """
    Call Google Places Nearby Search for gyms within radius_m metres.
    Returns a list of raw place result dicts (may be empty on error).
    """
    if not PLACES_API_KEY:
        logger.error("[Places] GOOGLE_PLACES_API_KEY not set — cannot fetch gyms.")
        return []

    params = {
        "location": f"{lat},{lng}",
        "radius":   radius_m,
        "type":     "gym",
        "key":      PLACES_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(NEARBY_SEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        status = data.get("status")
        if status not in ("OK", "ZERO_RESULTS"):
            logger.warning(f"[Places] Nearby search status={status} lat={lat} lng={lng}")
            return []

        results = data.get("results", [])
        logger.info(f"[Places] Nearby search → {len(results)} gyms at ({lat:.4f},{lng:.4f})")
        return results

    except Exception as e:
        logger.error(f"[Places] Nearby search error: {e}")
        return []


async def get_place_details(place_id: str) -> Optional[dict]:
    """
    Fetch full details for a place_id (phone, hours, photos, website).
    Returns None on error.
    """
    if not PLACES_API_KEY:
        return None

    params = {
        "place_id": place_id,
        "fields":   DETAILS_FIELDS,
        "key":      PLACES_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(PLACE_DETAILS_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        if data.get("status") != "OK":
            logger.warning(f"[Places] Details status={data.get('status')} place_id={place_id}")
            return None

        return data.get("result", {})

    except Exception as e:
        logger.error(f"[Places] Details error place_id={place_id}: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# DB upsert
# ─────────────────────────────────────────────────────────────────────────────

def upsert_gym_from_place(db: Session, place: dict, details: Optional[dict] = None) -> Gym:
    """
    Create or update a Gym row from a Google Places result.
    If `details` is provided (from Place Details API), enriches phone/hours/website.
    Always updates GymAmenities (creating if missing).
    Returns the Gym ORM object.
    """
    place_id = place["place_id"]

    # Use detailed result if available, fall back to nearby result
    source = details or place

    # Coordinates
    location = place.get("geometry", {}).get("location", {})
    lat = location.get("lat")
    lng = location.get("lng")

    # Address — Place Details gives formatted_address, Nearby gives vicinity
    address = (
        source.get("formatted_address")
        or source.get("vicinity")
        or place.get("vicinity")
    )

    # Photo references (first 3 photos)
    photos_raw = source.get("photos") or place.get("photos") or []
    photo_refs = [p["photo_reference"] for p in photos_raw[:3] if "photo_reference" in p]

    # Opening hours
    opening_hours = source.get("opening_hours") or {}
    opening_hours_clean = {
        "weekday_text": opening_hours.get("weekday_text", []),
        "open_now":     opening_hours.get("open_now", None),
    }

    # Amenity inference
    amenity_data = _infer_amenities({**place, **(details or {})})

    # Existing gym?
    gym = db.query(Gym).filter(Gym.place_id == place_id).first()

    if gym is None:
        gym = Gym(place_id=place_id)
        db.add(gym)
        logger.info(f"[Places] Creating gym: {source.get('name')} ({place_id})")
    else:
        logger.info(f"[Places] Updating gym: {source.get('name')} ({place_id})")

    # Update all fields
    gym_name = source.get("name") or place.get("name", "Unknown Gym")
    gym.name                  = gym_name
    gym.address               = address
    gym.lat                   = lat
    gym.lng                   = lng
    gym.rating                = source.get("rating") or place.get("rating")
    gym.user_ratings_total    = source.get("user_ratings_total") or place.get("user_ratings_total")
    gym.phone_number          = source.get("formatted_phone_number")
    gym.website               = source.get("website")
    gym.price_level           = source.get("price_level") or place.get("price_level")
    gym.opening_hours_json    = opening_hours_clean
    gym.photo_references_json = photo_refs
    gym.places_fetched_at     = datetime.now(timezone.utc)

    # Marketplace fields — infer from name (don't overwrite if owner has claimed)
    if not gym.is_claimed:
        gym.category   = _infer_category(gym_name)
        gym.chain_name = _infer_chain(gym_name)

    db.flush()  # get gym.id

    # Upsert amenities
    amenities = db.query(GymAmenities).filter(GymAmenities.gym_id == gym.id).first()
    if amenities is None:
        amenities = GymAmenities(gym_id=gym.id)
        db.add(amenities)

    # Only update amenities if not claimed (claimed gyms manage their own data)
    if not gym.is_claimed:
        amenities.is_24_7      = amenity_data["is_24_7"]
        amenities.has_trainers = amenity_data["has_trainers"]
        amenities.has_sauna    = amenity_data["has_sauna"]
        amenities.has_pool     = amenity_data["has_pool"]
        amenities.is_premium   = amenity_data["is_premium"]
        amenities.has_parking  = amenity_data["has_parking"]

    db.commit()
    db.refresh(gym)
    return gym


# ─────────────────────────────────────────────────────────────────────────────
# Area freshness check
# ─────────────────────────────────────────────────────────────────────────────

def area_needs_sync(db: Session, lat: float, lng: float, radius_deg: float = 0.03) -> bool:
    """
    Return True if we need to call Places API for this area.
    False = we already have enough fresh gyms nearby.
    radius_deg ≈ 0.03° ≈ 3 km
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS)

    fresh_count = (
        db.query(Gym)
        .filter(
            Gym.lat.between(lat - radius_deg, lat + radius_deg),
            Gym.lng.between(lng - radius_deg, lng + radius_deg),
            Gym.places_fetched_at.isnot(None),
            Gym.places_fetched_at >= cutoff,
        )
        .count()
    )

    needs = fresh_count < MIN_GYMS_CACHED_FOR_AREA
    logger.info(
        f"[Places] Area sync check ({lat:.4f},{lng:.4f}): "
        f"{fresh_count} fresh gyms — {'SYNC NEEDED' if needs else 'cache OK'}"
    )
    return needs
