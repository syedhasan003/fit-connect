# app/models/gym.py
from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy import JSON as SA_JSON
from app.database.session import Base

class Gym(Base):
    __tablename__ = "gym"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=True)
    locality = Column(String, nullable=True)

    # prices
    monthly_price = Column(Float, default=0.0)
    yearly_price = Column(Float, default=0.0)
    daily_pass_price = Column(Float, default=0.0)

    description = Column(String, nullable=True)

    # JSON columns for lists / complex objects
    amenities = Column(SA_JSON, default=[])
    images = Column(SA_JSON, default=[])
    gallery_images = Column(SA_JSON, default=[])
    membership_options = Column(SA_JSON, default=[])
    equipment_list = Column(SA_JSON, default=[])
    classes_available = Column(SA_JSON, default=[])

    personal_training_available = Column(Boolean, default=False)
    is_popular = Column(Boolean, default=False)

    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)

    cover_image = Column(String, nullable=True)
    video_url = Column(String, nullable=True)

    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)

    # opening_hours stored as JSON (we chose A)
    opening_hours = Column(SA_JSON, default={})
