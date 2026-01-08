from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os, uuid

from app.db.database import get_db
from app.models.gym import Gym
from app.models.gallery import GalleryItem
from app.schemas.gallery import GalleryItemOut
from app.deps import get_current_user, require_gym_owner_or_admin
from app.services.roles import require_roles

router = APIRouter(prefix="/gyms", tags=["Gallery"])

# === limits ===
MAX_VIDEO_SIZE_MB = 50
MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024

ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime"
]


# === upload gallery items (owner OR admin) ===
@router.post(
    "/{gym_id}/gallery",
    response_model=List[GalleryItemOut],
    dependencies=[Depends(require_gym_owner_or_admin)]
)
async def upload_gallery_items(
    gym_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    # require_gym_owner_or_admin already ensured permission

    folder_path = f"static/gyms/{gym_id}/gallery"
    os.makedirs(folder_path, exist_ok=True)

    created_items = []

    for upload in files:
        mime = upload.content_type or ""

        # read content once
        content = await upload.read()

        # === validation ===
        if mime.startswith("image/"):
            media_type = "image"
        elif mime.startswith("video/"):
            if mime not in ALLOWED_VIDEO_TYPES:
                raise HTTPException(status_code=400, detail="Only MP4/MPEG/MOV videos allowed")

            if len(content) > MAX_VIDEO_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Video too large. Max allowed is {MAX_VIDEO_SIZE_MB}MB."
                )

            media_type = "video"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported media type: {mime}")

        # === file saving ===
        ext = upload.filename.split(".")[-1]
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        save_path = f"{folder_path}/{unique_name}"

        with open(save_path, "wb") as f:
            f.write(content)

        file_url = f"/static/gyms/{gym_id}/gallery/{unique_name}"

        # === save to DB ===
        item = GalleryItem(
            gym_id=gym_id,
            file_url=file_url,
            media_type=media_type
        )

        db.add(item)
        db.commit()
        db.refresh(item)

        created_items.append(item)

    # also append saved file URLs to Gym.gallery_images (optional)
    existing = gym.gallery_images or []
    gym.gallery_images = existing + [ci.file_url for ci in created_items]
    db.commit()
    db.refresh(gym)

    return created_items


# === list gallery items (public) ===
@router.get("/{gym_id}/gallery", response_model=List[GalleryItemOut])
def list_gallery_items(gym_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(GalleryItem)
        .filter(GalleryItem.gym_id == gym_id)
        .order_by(GalleryItem.created_at.desc())
        .all()
    )
    return items
