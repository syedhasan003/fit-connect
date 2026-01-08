from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class GalleryItem(Base):
    __tablename__ = "gallery_items"
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String, nullable=False)
    media_type = Column(String, nullable=False)  # "image" or "video"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
