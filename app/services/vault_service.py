from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models.vault_item import VaultItem
from app.models.user import User


class VaultService:
    """
    Business logic for Vault items.
    """

    # -------------------------------------------------
    # CREATE
    # -------------------------------------------------
    def create_item(
        self,
        db: Session,
        user: User,
        type: str,
        category: str,
        title: str,
        summary: Optional[str],
        content: dict,
        source: str = "manual",
        pinned: bool = False,
    ) -> VaultItem:
        item = VaultItem(
            user_id=user.id,
            type=type,
            category=category,
            title=title,
            summary=summary,
            content=content,   # JSON column
            source=source,
            pinned=pinned,
            updated_at=datetime.utcnow(),
        )

        db.add(item)
        db.commit()
        db.refresh(item)

        return item

    # -------------------------------------------------
    # LIST
    # -------------------------------------------------
    def list_items(
        self,
        db: Session,
        user: User,
    ) -> List[VaultItem]:
        return (
            db.query(VaultItem)
            .filter(VaultItem.user_id == user.id)
            .order_by(VaultItem.pinned.desc(), VaultItem.created_at.desc())
            .all()
        )

    # -------------------------------------------------
    # GET SINGLE
    # -------------------------------------------------
    def get_item(
        self,
        db: Session,
        user: User,
        item_id: int,
    ) -> Optional[VaultItem]:
        return (
            db.query(VaultItem)
            .filter(
                VaultItem.id == item_id,
                VaultItem.user_id == user.id,
            )
            .first()
        )

    # -------------------------------------------------
    # UPDATE
    # -------------------------------------------------
    def update_item(
        self,
        db: Session,
        user: User,
        item_id: int,
        updates: dict,
    ) -> Optional[VaultItem]:
        """
        Update a vault item with partial data.
        Only updates fields that are provided in the updates dict.
        """
        item = db.query(VaultItem).filter(
            VaultItem.id == item_id,
            VaultItem.user_id == user.id
        ).first()
        
        if not item:
            return None
        
        # Update only provided fields
        for key, value in updates.items():
            if hasattr(item, key):
                setattr(item, key, value)
        
        # Always update the timestamp
        item.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(item)
        return item

    # -------------------------------------------------
    # DELETE
    # -------------------------------------------------
    def delete_item(
        self,
        db: Session,
        user: User,
        item_id: int,
    ) -> bool:
        """
        Delete a vault item.
        Returns True if deleted, False if not found.
        """
        item = db.query(VaultItem).filter(
            VaultItem.id == item_id,
            VaultItem.user_id == user.id
        ).first()
        
        if not item:
            return False
        
        db.delete(item)
        db.commit()
        return True