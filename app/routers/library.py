import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.library_item import LibraryItem
from app.models.health_memory import HealthMemory

router = APIRouter(prefix="/library", tags=["Library"])

BASE_UPLOAD_DIR = "backend/static/library"


@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    category: str = Form(...),  # medical, prescription, report, scan
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------
    # Create user directory
    # -----------------------------
    user_dir = os.path.join(BASE_UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, file.filename)

    # -----------------------------
    # Save file
    # -----------------------------
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # -----------------------------
    # Store in Library
    # -----------------------------
    library_item = LibraryItem(
        user_id=current_user.id,
        file_path=file_path,
        file_type=file.content_type,
        category=category,
    )

    db.add(library_item)
    db.commit()
    db.refresh(library_item)

    # -----------------------------
    # Create Health Memory (AI-ready)
    # -----------------------------
    memory = HealthMemory(
        user_id=current_user.id,
        category="medical_document",
        source="library_upload",
        content={
            "file_path": file_path,
            "file_type": file.content_type,
            "category": category,
            "status": "uploaded",
        },
    )

    db.add(memory)
    db.commit()

    return {
        "id": library_item.id,
        "file_path": file_path,
        "category": category,
    }


@router.get("/")
def list_library(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(LibraryItem)
        .filter(LibraryItem.user_id == current_user.id)
        .order_by(LibraryItem.created_at.desc())
        .all()
    )

    return [
        {
            "id": i.id,
            "file_path": i.file_path,
            "file_type": i.file_type,
            "category": i.category,
            "created_at": i.created_at,
        }
        for i in items
    ]


@router.delete("/{item_id}")
def delete_library_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(LibraryItem)
        .filter(
            LibraryItem.id == item_id,
            LibraryItem.user_id == current_user.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(item.file_path):
        os.remove(item.file_path)

    db.delete(item)
    db.commit()

    return {"status": "deleted"}
