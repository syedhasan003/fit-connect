from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.db.database import Base

class Gym(Base):
    __tablename__ = "gyms"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, nullable=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    lat = Column(Float, nullable=True, index=True)
    lng = Column(Float, nullable=True, index=True)
    cover_image_url = Column(String, nullable=True)
    gallery_images = Column(JSON, default=[])

    # ── Google Places data ──────────────────────────────────────────────────
    place_id            = Column(String, unique=True, nullable=True, index=True)
    places_fetched_at   = Column(DateTime(timezone=True), nullable=True)   # cache TTL
    rating              = Column(Float, nullable=True)      # 1.0 – 5.0
    user_ratings_total  = Column(Integer, nullable=True)    # number of Google reviews
    phone_number        = Column(String, nullable=True)     # formatted phone
    website             = Column(String, nullable=True)
    opening_hours_json  = Column(JSON, nullable=True)       # {"weekday_text": [...], "periods": [...]}
    photo_references_json = Column(JSON, nullable=True)     # list of photo_reference strings
    price_level         = Column(Integer, nullable=True)    # 0-4 (Google price level)
    is_claimed          = Column(Boolean, default=False)    # gym owner has verified listing

    created_at = Column(DateTime(timezone=True), server_default=func.now())
