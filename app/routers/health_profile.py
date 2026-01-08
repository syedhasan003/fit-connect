from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.health_profile import HealthProfile
from app.schemas.health_profile import HealthProfileCreate, HealthProfileOut
from app.models.user import User

router = APIRouter(prefix="/health", tags=["Health"])

@router.post("/", response_model=HealthProfileOut)
def create_or_update_health_profile(
    payload: HealthProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == current_user.id)
        .first()
    )

    if profile:
        for key, value in payload.dict().items():
            setattr(profile, key, value)
    else:
        profile = HealthProfile(
            user_id=current_user.id,
            **payload.dict()
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/", response_model=HealthProfileOut)
def get_health_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Health profile not found")

    return profile
