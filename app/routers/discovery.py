from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from typing import List, Optional
import math

from app.db.database import get_db
from app.models.gym import Gym
from app.models.visit import Visit
from app.models.gym_amenities import GymAmenities
from app.schemas.discovery import (
    DiscoveryGymOut,
    FeaturedGymOut,
    DiscoveryFilterParams,
)
from app.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/discovery", tags=["Discovery"])


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula.
    Returns distance in kilometers.
    """
    if not all([lat1, lng1, lat2, lng2]):
        return None
    
    # Radius of Earth in kilometers
    R = 6371.0
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    # Haversine formula
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


# ---------------------------------------------------------
# DISCOVERY FEED (Enhanced with amenities & filtering)
# ---------------------------------------------------------
@router.get("/gyms", response_model=List[DiscoveryGymOut])
def discover_gyms(
    skip: int = 0,
    limit: int = 20,
    user_lat: Optional[float] = Query(None, description="User latitude for distance calc"),
    user_lng: Optional[float] = Query(None, description="User longitude for distance calc"),
    is_24_7: Optional[bool] = Query(None, description="Filter by 24/7 availability"),
    has_trainers: Optional[bool] = Query(None, description="Filter by trainers"),
    has_sauna: Optional[bool] = Query(None, description="Filter by sauna"),
    is_premium: Optional[bool] = Query(None, description="Filter by premium status"),
    max_distance_km: Optional[float] = Query(None, description="Max distance in km"),
    sort_by: str = Query("popular", description="Sort by: popular, distance, newest"),
    db: Session = Depends(get_db),
):
    """
    Enhanced discovery feed with:
    - Amenity filtering (24/7, trainers, sauna, premium)
    - Distance calculation and filtering
    - Multiple sorting options
    - Visit count tracking
    """
    
    # Base query with amenities join
    query = (
        db.query(
            Gym,
            GymAmenities,
            func.count(Visit.id).label("visit_count")
        )
        .outerjoin(GymAmenities, GymAmenities.gym_id == Gym.id)
        .outerjoin(Visit, Visit.gym_id == Gym.id)
        .group_by(Gym.id, GymAmenities.id)
    )
    
    # Apply amenity filters
    if is_24_7 is not None:
        query = query.filter(GymAmenities.is_24_7 == is_24_7)
    
    if has_trainers is not None:
        query = query.filter(GymAmenities.has_trainers == has_trainers)
    
    if has_sauna is not None:
        query = query.filter(GymAmenities.has_sauna == has_sauna)
    
    if is_premium is not None:
        query = query.filter(GymAmenities.is_premium == is_premium)
    
    # Apply sorting
    if sort_by == "distance" and user_lat and user_lng:
        # Sort by distance (calculated in Python after query)
        pass  # We'll sort after fetching
    elif sort_by == "newest":
        query = query.order_by(Gym.created_at.desc())
    else:  # Default: popular
        query = query.order_by(func.count(Visit.id).desc())
    
    # Fetch results
    results = query.offset(skip).limit(limit).all()
    
    # Build response with distance calculation
    gym_list = []
    for gym, amenities, visit_count in results:
        # Calculate distance if user location provided
        distance_km = None
        if user_lat and user_lng and gym.lat and gym.lng:
            distance_km = calculate_distance(user_lat, user_lng, gym.lat, gym.lng)
            
            # Skip if beyond max distance
            if max_distance_km and distance_km > max_distance_km:
                continue
        
        gym_data = DiscoveryGymOut(
            id=gym.id,
            name=gym.name,
            address=gym.address,
            cover_image_url=gym.cover_image_url,
            lat=gym.lat,
            lng=gym.lng,
            visit_count=visit_count or 0,
            distance_km=distance_km,
            # Amenities
            is_24_7=amenities.is_24_7 if amenities else False,
            has_trainers=amenities.has_trainers if amenities else False,
            has_sauna=amenities.has_sauna if amenities else False,
            has_pool=amenities.has_pool if amenities else False,
            has_parking=amenities.has_parking if amenities else False,
            is_premium=amenities.is_premium if amenities else False,
        )
        
        gym_list.append(gym_data)
    
    # Sort by distance if requested
    if sort_by == "distance" and user_lat and user_lng:
        gym_list.sort(key=lambda x: x.distance_km if x.distance_km is not None else float('inf'))
    
    return gym_list


# ---------------------------------------------------------
# FEATURED GYMS (Trending near you)
# ---------------------------------------------------------
@router.get("/featured", response_model=List[FeaturedGymOut])
def featured_gyms(
    days: int = Query(7, description="Trending window in days"),
    limit: int = 10,
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Featured/trending gyms with visit count in time window.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    query = (
        db.query(
            Gym,
            GymAmenities,
            func.count(Visit.id).label("visit_count")
        )
        .join(Visit, Visit.gym_id == Gym.id)
        .outerjoin(GymAmenities, GymAmenities.gym_id == Gym.id)
        .filter(Visit.created_at >= since)
        .group_by(Gym.id, GymAmenities.id)
        .order_by(func.count(Visit.id).desc())
        .limit(limit)
    )
    
    results = query.all()
    
    featured_list = []
    for gym, amenities, visit_count in results:
        distance_km = None
        if user_lat and user_lng and gym.lat and gym.lng:
            distance_km = calculate_distance(user_lat, user_lng, gym.lat, gym.lng)
        
        # Determine featured reason
        if distance_km and distance_km < 2:
            reason = f"Trending near you • {distance_km:.1f} km away"
        elif visit_count > 50:
            reason = f"Most popular • {visit_count} visits this week"
        else:
            reason = f"Trending in your area"
        
        featured_data = FeaturedGymOut(
            id=gym.id,
            name=gym.name,
            address=gym.address,
            cover_image_url=gym.cover_image_url,
            lat=gym.lat,
            lng=gym.lng,
            visit_count=visit_count,
            distance_km=distance_km,
            featured_reason=reason,
            # Amenities
            is_24_7=amenities.is_24_7 if amenities else False,
            has_trainers=amenities.has_trainers if amenities else False,
            has_sauna=amenities.has_sauna if amenities else False,
            has_pool=amenities.has_pool if amenities else False,
            has_parking=amenities.has_parking if amenities else False,
            is_premium=amenities.is_premium if amenities else False,
        )
        
        featured_list.append(featured_data)
    
    return featured_list


# ---------------------------------------------------------
# NEARBY GYMS (Sorted by distance)
# ---------------------------------------------------------
@router.get("/nearby", response_model=List[DiscoveryGymOut])
def nearby_gyms(
    user_lat: float = Query(..., description="User latitude (required)"),
    user_lng: float = Query(..., description="User longitude (required)"),
    radius_km: float = Query(5.0, description="Search radius in km"),
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """
    Find gyms within radius, sorted by distance.
    Requires user location.
    """
    
    # Fetch all gyms with lat/lng
    query = (
        db.query(
            Gym,
            GymAmenities,
            func.count(Visit.id).label("visit_count")
        )
        .outerjoin(GymAmenities, GymAmenities.gym_id == Gym.id)
        .outerjoin(Visit, Visit.gym_id == Gym.id)
        .filter(Gym.lat.isnot(None))
        .filter(Gym.lng.isnot(None))
        .group_by(Gym.id, GymAmenities.id)
    )
    
    results = query.all()
    
    # Calculate distances and filter by radius
    nearby_list = []
    for gym, amenities, visit_count in results:
        distance_km = calculate_distance(user_lat, user_lng, gym.lat, gym.lng)
        
        if distance_km and distance_km <= radius_km:
            gym_data = DiscoveryGymOut(
                id=gym.id,
                name=gym.name,
                address=gym.address,
                cover_image_url=gym.cover_image_url,
                lat=gym.lat,
                lng=gym.lng,
                visit_count=visit_count or 0,
                distance_km=distance_km,
                is_24_7=amenities.is_24_7 if amenities else False,
                has_trainers=amenities.has_trainers if amenities else False,
                has_sauna=amenities.has_sauna if amenities else False,
                has_pool=amenities.has_pool if amenities else False,
                has_parking=amenities.has_parking if amenities else False,
                is_premium=amenities.is_premium if amenities else False,
            )
            nearby_list.append(gym_data)
    
    # Sort by distance (closest first)
    nearby_list.sort(key=lambda x: x.distance_km)
    
    return nearby_list[:limit]