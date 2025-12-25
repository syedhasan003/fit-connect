from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from app.db.database import get_db
from app.schemas.gym import GymCreate, GymUpdate, GymOut
from app.models.gym import Gym
from app.deps import get_current_user, require_gym_owner_or_admin
from app.services.roles import require_roles
from app.models.user import User
from app.schemas.gym_amenities import GymAmenitiesOut
from app.schemas.gym_equipment import GymEquipmentOut
from app.schemas.gym_pricing import GymPricingOut
from app.schemas.gym_trainer import GymTrainerOut

router = APIRouter(prefix="/gyms", tags=["Gyms"])


# ---------------------------------------------------
# CREATE GYM (admin + gym_owner)
# owner_id = creator
# ---------------------------------------------------
@router.post(
    "/",
    response_model=GymOut,
    dependencies=[Depends(require_roles(["admin", "gym_owner"]))]
)
def create_gym(
    gym_in: GymCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = Gym(**gym_in.dict(), owner_id=current_user.id)
    db.add(gym)
    db.commit()
    db.refresh(gym)
    return gym


# ---------------------------------------------------
# LIST GYMS (public)
# ---------------------------------------------------
@router.get("/", response_model=List[GymOut])
def list_gyms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Gym).offset(skip).limit(limit).all()


# ---------------------------------------------------
# GET GYM (public)
# ---------------------------------------------------
@router.get("/{gym_id}", response_model=GymOut)
def get_gym(gym_id: int, db: Session = Depends(get_db)):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    return gym


# ---------------------------------------------------
# UPLOAD COVER IMAGE (admin OR owner)
# ---------------------------------------------------
@router.post(
    "/{gym_id}/cover",
    response_model=GymOut,
    dependencies=[Depends(require_gym_owner_or_admin)]
)
async def upload_cover_image(
    gym_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads allowed")

    folder_path = f"static/gyms/{gym_id}"
    os.makedirs(folder_path, exist_ok=True)

    file_path = f"{folder_path}/cover.jpg"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    gym.cover_image_url = f"/static/gyms/{gym_id}/cover.jpg"
    db.commit()
    db.refresh(gym)

    return gym


# ---------------------------------------------------
# UPLOAD GALLERY (Images + Videos)
# ---------------------------------------------------
@router.post(
    "/{gym_id}/gallery",
    response_model=List[dict],
    dependencies=[Depends(require_gym_owner_or_admin)]
)
async def upload_gallery_images(
    gym_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()

    gallery_path = f"static/gyms/{gym_id}/gallery"
    os.makedirs(gallery_path, exist_ok=True)

    saved_items = []

    for file in files:
        content_type = file.content_type

        if not (
            content_type.startswith("image/") or
            content_type.startswith("video/")
        ):
            raise HTTPException(
                status_code=400,
                detail="Only images or videos allowed"
            )

        # Make filename unique
        filename = file.filename
        idx = 0
        base = filename

        # fix path checking bug
        while os.path.exists(os.path.join(gallery_path, filename)):
            idx += 1
            filename = f"{idx}_{base}"

        file_path = os.path.join(gallery_path, filename)

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        saved_items.append({
            "gym_id": gym_id,
            "file_url": f"/static/gyms/{gym_id}/gallery/{filename}",
            "media_type": "video" if content_type.startswith("video/") else "image"
        })

    db.commit()
    return saved_items


# ---------------------------------------------------
# UPDATE GYM (admin OR owner)
# ---------------------------------------------------
@router.patch(
    "/{gym_id}",
    response_model=GymOut,
    dependencies=[Depends(require_gym_owner_or_admin)]
)
def update_gym(
    gym_id: int,
    gym_in: GymUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")

    update_data = gym_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(gym, key, value)

    db.commit()
    db.refresh(gym)
    return gym


# ---------------------------------------------------
# DELETE GYM (admin OR owner)
# ---------------------------------------------------
@router.delete(
    "/{gym_id}",
    dependencies=[Depends(require_gym_owner_or_admin)]
)
def delete_gym(
    gym_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")

    # delete static folder
    folder = f"static/gyms/{gym_id}"
    if os.path.exists(folder):
        shutil.rmtree(folder)

    db.delete(gym)
    db.commit()

    return {"message": "Gym deleted successfully"}

    # ---------------------------------------------------
# GET GYM AMENITIES (public)
# ---------------------------------------------------
@router.get("/{gym_id}/amenities", response_model=GymAmenitiesOut)
def get_gym_amenities(gym_id: int, db: Session = Depends(get_db)):
    amenities = db.query(GymAmenities).filter(
        GymAmenities.gym_id == gym_id
    ).first()
    if not amenities:
        raise HTTPException(status_code=404, detail="Amenities not found")
    return amenities


# ---------------------------------------------------
# GET GYM EQUIPMENT (public)
# ---------------------------------------------------
@router.get("/{gym_id}/equipment", response_model=List[GymEquipmentOut])
def get_gym_equipment(gym_id: int, db: Session = Depends(get_db)):
    return db.query(GymEquipment).filter(
        GymEquipment.gym_id == gym_id
    ).all()


# ---------------------------------------------------
# GET GYM PRICING (public)
# ---------------------------------------------------
@router.get("/{gym_id}/pricing", response_model=List[GymPricingOut])
def get_gym_pricing(gym_id: int, db: Session = Depends(get_db)):
    return db.query(GymPricing).filter(
        GymPricing.gym_id == gym_id
    ).all()


# ---------------------------------------------------
# GET GYM TRAINERS (public)
# ---------------------------------------------------
@router.get("/{gym_id}/trainers", response_model=List[GymTrainerOut])
def get_gym_trainers(gym_id: int, db: Session = Depends(get_db)):
    return db.query(GymTrainer).filter(
        GymTrainer.gym_id == gym_id
    ).all()

