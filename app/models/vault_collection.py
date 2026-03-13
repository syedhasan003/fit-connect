from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# Many-to-many join table: collections ↔ vault_items
collection_items = Table(
    "collection_items",
    Base.metadata,
    Column("collection_id", Integer, ForeignKey("vault_collections.id", ondelete="CASCADE"), primary_key=True),
    Column("vault_item_id", Integer, ForeignKey("vault_items.id",       ondelete="CASCADE"), primary_key=True),
)

class VaultCollection(Base):
    __tablename__ = "vault_collections"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, index=True, nullable=False)
    name        = Column(String, nullable=False)
    description = Column(String, nullable=True)
    color       = Column(String, default="#F97316")   # accent hex for UI

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    items = relationship("VaultItem", secondary=collection_items, lazy="selectin")
