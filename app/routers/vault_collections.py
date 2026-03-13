from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.vault_collection import VaultCollection, collection_items
from app.models.vault_item import VaultItem
from app.schemas.vault import VaultResponse

router = APIRouter(prefix="/vault/collections", tags=["VaultCollections"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#F97316"

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class CollectionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    item_count: int
    created_at: str

    class Config:
        from_attributes = True

class CollectionDetailResponse(CollectionResponse):
    items: List[VaultResponse]

# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    payload: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = VaultCollection(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        color=payload.color or "#F97316",
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return _serialize(col)


@router.get("/", response_model=List[CollectionResponse])
def list_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cols = db.query(VaultCollection).filter(VaultCollection.user_id == current_user.id).all()
    return [_serialize(c) for c in cols]


@router.get("/{collection_id}", response_model=CollectionDetailResponse)
def get_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = _get_or_404(db, collection_id, current_user.id)
    return _serialize_detail(col)


@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: int,
    payload: CollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = _get_or_404(db, collection_id, current_user.id)
    if payload.name        is not None: col.name        = payload.name
    if payload.description is not None: col.description = payload.description
    if payload.color       is not None: col.color       = payload.color
    db.commit()
    db.refresh(col)
    return _serialize(col)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col = _get_or_404(db, collection_id, current_user.id)
    db.delete(col)
    db.commit()


@router.post("/{collection_id}/items/{item_id}", response_model=CollectionDetailResponse)
def add_item_to_collection(
    collection_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col  = _get_or_404(db, collection_id, current_user.id)
    item = db.query(VaultItem).filter(VaultItem.id == item_id, VaultItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vault item not found")
    if item not in col.items:
        col.items.append(item)
        db.commit()
        db.refresh(col)
    return _serialize_detail(col)


@router.delete("/{collection_id}/items/{item_id}", response_model=CollectionDetailResponse)
def remove_item_from_collection(
    collection_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    col  = _get_or_404(db, collection_id, current_user.id)
    item = db.query(VaultItem).filter(VaultItem.id == item_id, VaultItem.user_id == current_user.id).first()
    if item and item in col.items:
        col.items.remove(item)
        db.commit()
        db.refresh(col)
    return _serialize_detail(col)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_or_404(db, collection_id, user_id):
    col = db.query(VaultCollection).filter(
        VaultCollection.id == collection_id,
        VaultCollection.user_id == user_id,
    ).first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    return col

def _serialize(col: VaultCollection) -> dict:
    return {
        "id":          col.id,
        "name":        col.name,
        "description": col.description,
        "color":       col.color,
        "item_count":  len(col.items),
        "created_at":  col.created_at.isoformat(),
    }

def _serialize_detail(col: VaultCollection) -> dict:
    base = _serialize(col)
    base["items"] = [
        {
            "id":         i.id,
            "type":       i.type,
            "category":   i.category,
            "title":      i.title,
            "summary":    i.summary,
            "content":    i.content,
            "source":     i.source,
            "pinned":     i.pinned,
            "created_at": i.created_at.isoformat(),
            "updated_at": i.updated_at.isoformat(),
        }
        for i in col.items
    ]
    return base
