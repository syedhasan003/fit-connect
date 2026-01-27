from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.user_gym import UserGymLink
from app.models.gym import Gym

router = APIRouter(prefix="/users", tags=["Users"])


# ---------------------------------------------------
# GET CURRENT USER (FOUNDATIONAL)
# ---------------------------------------------------
@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name if hasattr(current_user, "name") else None,
        "role": current_user.role,
    }


# ---------------------------------------------------
# SELECT GYM (user)
# ---------------------------------------------------
@router.post("/select-gym")
def select_gym(
    gym_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")

    existing_link = db.query(UserGymLink).filter(
        UserGymLink.user_id == current_user.id
    ).first()

    if existing_link:
        existing_link.gym_id = gym_id
    else:
        link = UserGymLink(user_id=current_user.id, gym_id=gym_id)
        db.add(link)

    db.commit()
    return {"message": "Gym selected successfully"}


# ---------------------------------------------------
# GET MY GYM (user)
# ---------------------------------------------------
@router.get("/my-gym")
def get_my_gym(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.query(UserGymLink).filter(
        UserGymLink.user_id == current_user.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="No gym selected")

    gym = db.query(Gym).filter(Gym.id == link.gym_id).first()
    return gym
