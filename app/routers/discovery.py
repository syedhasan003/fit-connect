from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List

from app.db.database import get_db
from app.models.gym import Gym
from app.models.visit import Visit
from app.schemas.discovery import DiscoveryGymOut, FeaturedGymOut

router = APIRouter(prefix="/discovery", tags=["Discovery"])


# ---------------------------------------------------------
# DISCOVERY FEED (Instagram-style gym list)
# ---------------------------------------------------------
@router.get("/gyms", response_model=List[DiscoveryGymOut])
def discover_gyms(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    gyms = (
        db.query(
            Gym,
            func.count(Visit.id).label("visit_count")
        )
        .outerjoin(Visit, Visit.gym_id == Gym.id)
        .group_by(Gym.id)
        .order_by(func.count(Visit.id).desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for gym, visit_count in gyms:
        results.append(
            DiscoveryGymOut(
                id=gym.id,
                name=gym.name,
                address=gym.address,
                cover_image_url=gym.cover_image_url,
                lat=gym.lat,
                lng=gym.lng,
                visit_count=visit_count or 0,
            )
        )

    return results


# ---------------------------------------------------------
# FEATURED GYMS (Trending / Near You later)
# ---------------------------------------------------------
@router.get("/featured", response_model=List[FeaturedGymOut])
def featured_gyms(
    days: int = Query(7, description="Trending window in days"),
    limit: int = 10,
    db: Session = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)

    gyms = (
        db.query(
            Gym,
            func.count(Visit.id).label("visit_count")
        )
        .join(Visit, Visit.gym_id == Gym.id)
        .filter(Visit.created_at >= since)
        .group_by(Gym.id)
        .order_by(func.count(Visit.id).desc())
        .limit(limit)
        .all()
    )

    results = []
    for gym, visit_count in gyms:
        results.append(
            FeaturedGymOut(
                id=gym.id,
                name=gym.name,
                address=gym.address,
                cover_image_url=gym.cover_image_url,
                lat=gym.lat,
                lng=gym.lng,
                visit_count=visit_count,
                featured_reason="Trending near you",
            )
        )

    return results
