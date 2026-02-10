from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.vault import VaultCreate, VaultResponse
from app.services.vault_service import VaultService
from app.services.health_timeline_service import HealthTimelineService

router = APIRouter(prefix="/vault", tags=["Vault"])

vault_service = VaultService()
health_timeline_service = HealthTimelineService()

# -------------------------------------------------
# 🔒 READ-ONLY HEALTH TIMELINE (SPECIAL ROUTE)
# MUST COME BEFORE /{item_id}
# -------------------------------------------------
@router.get("/health-timeline")
def get_health_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Read-only health timeline.
    Aggregates daily snapshots + health memory.
    """
    return health_timeline_service.get_timeline(
        db=db,
        user_id=current_user.id,
    )


# -------------------------------------------------
# CREATE VAULT ITEM
# -------------------------------------------------
@router.post("/", response_model=VaultResponse)
def create_vault_item(
    payload: VaultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new Vault item (workout, diet, report, memory, etc).
    """
    return vault_service.create_item(
        db=db,
        user=current_user,
        type=payload.type,
        category=payload.category,
        title=payload.title,
        summary=payload.summary,
        content=payload.content,
        source=payload.source,
        pinned=payload.pinned,
    )


# -------------------------------------------------
# LIST VAULT ITEMS
# -------------------------------------------------
@router.get("/", response_model=List[VaultResponse])
def list_vault_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all Vault items for the current user.
    """
    return vault_service.list_items(
        db=db,
        user=current_user,
    )


# -------------------------------------------------
# GET SINGLE VAULT ITEM (⚠️ GENERIC — MUST BE LAST)
# -------------------------------------------------
@router.get("/{item_id}", response_model=VaultResponse)
def get_vault_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch a single Vault item by ID.
    """
    item = vault_service.get_item(
        db=db,
        user=current_user,
        item_id=item_id,
    )

    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    return item


# -------------------------------------------------
# UPDATE VAULT ITEM (PATCH)
# -------------------------------------------------
@router.patch("/{item_id}", response_model=VaultResponse)
def update_vault_item(
    item_id: int,
    payload: VaultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a Vault item (partial update).
    """
    item = vault_service.update_item(
        db=db,
        user=current_user,
        item_id=item_id,
        updates=payload.dict(exclude_unset=True),
    )

    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")

    return item


# -------------------------------------------------
# DELETE VAULT ITEM
# -------------------------------------------------
@router.delete("/{item_id}")
def delete_vault_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a Vault item by ID.
    """
    success = vault_service.delete_item(
        db=db,
        user=current_user,
        item_id=item_id,
    )

    if not success:
        raise HTTPException(status_code=404, detail="Vault item not found")

    return {"message": "Item deleted successfully", "item_id": item_id}