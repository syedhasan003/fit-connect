# app/routers/gym.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import SessionLocal
from app.models.gym import Gym
from app.schemas.gym import GymCreate, GymRead, GymUpdate
from datetime import datetime

router = APIRouter(prefix="/gyms", tags=["Gyms"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[GymRead])
def list_gyms(
    city: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None, regex="^(price_asc|price_desc)$"),
    amenities: Optional[str] = Query(None, description="Filter by single amenity"),
    membership: Optional[str] = Query(None, description="Filter by membership option"),
    open_now: Optional[bool] = Query(False, description="Return only gyms open now"),
    db: Session = Depends(get_db)
):
    query = db.query(Gym)

    if city:
        query = query.filter(Gym.city == city)
    if locality:
        query = query.filter(Gym.locality == locality)
    if min_price is not None:
        query = query.filter(Gym.monthly_price >= min_price)
    if max_price is not None:
        query = query.filter(Gym.monthly_price <= max_price)
    if search:
        likeq = f"%{search}%"
        query = query.filter(Gym.name.ilike(likeq) | Gym.description.ilike(likeq))
    if amenities:
        # basic filter: check amenity exists in the JSON array
        query = query.filter(Gym.amenities.contains([amenities]))
    if membership:
        query = query.filter(Gym.membership_options.contains([membership]))

    # open_now: check opening_hours JSON for the current weekday and time
    if open_now:
        now = datetime.utcnow().time()  # UTC - adjust later if you want local timezone
        weekday = datetime.utcnow().strftime("%A").lower()  # e.g., 'monday'
        results = []
        for gym in query.all():
            oh = gym.opening_hours or {}
            period = oh.get(weekday)
            if not period:
                continue
            try:
                start_str, end_str = period.split("-")
                start = datetime.strptime(start_str, "%H:%M").time()
                end = datetime.strptime(end_str, "%H:%M").time()
                if start <= now <= end:
                    results.append(gym)
            except Exception:
                # if parse fails, skip
                continue
        # return results (bypass DB pagination)
        return results

    if sort_by:
        if sort_by == "price_asc":
            query = query.order_by(Gym.monthly_price.asc())
        else:
            query = query.order_by(Gym.monthly_price.desc())

    return query.all()

@router.post("/", response_model=GymRead, status_code=201)
def create_gym(gym_in: GymCreate, db: Session = Depends(get_db)):
    gym = Gym(**gym_in.model_dump())
    db.add(gym)
    db.commit()
    db.refresh(gym)
    return gym

@router.get("/{gym_id}", response_model=GymRead)
def get_gym_by_id(gym_id: int, db: Session = Depends(get_db)):
    gym = db.get(Gym, gym_id)
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    return gym

@router.put("/{gym_id}", response_model=GymRead)
def update_gym(gym_id: int, gym_in: GymUpdate, db: Session = Depends(get_db)):
    gym = db.get(Gym, gym_id)
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    data = gym_in.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(gym, k, v)
    db.add(gym)
    db.commit()
    db.refresh(gym)
    return gym

@router.delete("/{gym_id}", status_code=204)
def delete_gym(gym_id: int, db: Session = Depends(get_db)):
    gym = db.get(Gym, gym_id)
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    db.delete(gym)
    db.commit()
    return {}
