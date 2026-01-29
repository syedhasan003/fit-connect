from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func

from app.db.database import Base


class VaultItem(Base):
    __tablename__ = "vault_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)

    # Logical type of item (workout, diet, report, medical, note, etc.)
    type = Column(String, nullable=False)

    # UI / grouping category
    category = Column(String, nullable=False)

    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)

    # Main payload (JSON blob)
    content = Column(JSON, nullable=False)

    # manual | ai | imported | synced
    source = Column(String, nullable=True)

    pinned = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
