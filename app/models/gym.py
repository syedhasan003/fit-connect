from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class Gym(Base):
    __tablename__ = "gyms"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, nullable=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    cover_image_url = Column(String, nullable=True)

    gallery_images = Column(JSON, default=[])   # ← NOW it's safe

    created_at = Column(DateTime(timezone=True), server_default=func.now())
