from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.database import Base


class GymAmenities(Base):
    """
    Gym amenities and features for filtering and discovery.
    """
    __tablename__ = "gym_amenities"

    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), unique=True, nullable=False)
    
    # Core amenities
    is_24_7 = Column(Boolean, default=False, nullable=False)
    has_trainers = Column(Boolean, default=False, nullable=False)
    has_sauna = Column(Boolean, default=False, nullable=False)
    has_pool = Column(Boolean, default=False, nullable=False)
    has_parking = Column(Boolean, default=False, nullable=False)
    has_lockers = Column(Boolean, default=False, nullable=False)
    has_showers = Column(Boolean, default=False, nullable=False)
    has_wifi = Column(Boolean, default=False, nullable=False)
    
    # Premium features
    is_premium = Column(Boolean, default=False, nullable=False)
    has_spa = Column(Boolean, default=False, nullable=False)
    has_juice_bar = Column(Boolean, default=False, nullable=False)
    has_childcare = Column(Boolean, default=False, nullable=False)
    
    # Equipment categories
    has_cardio = Column(Boolean, default=True, nullable=False)
    has_strength = Column(Boolean, default=True, nullable=False)
    has_free_weights = Column(Boolean, default=True, nullable=False)
    has_functional = Column(Boolean, default=False, nullable=False)
    
    # Classes
    has_group_classes = Column(Boolean, default=False, nullable=False)
    has_yoga = Column(Boolean, default=False, nullable=False)
    has_pilates = Column(Boolean, default=False, nullable=False)
    has_spinning = Column(Boolean, default=False, nullable=False)
    
    # Accessibility
    wheelchair_accessible = Column(Boolean, default=False, nullable=False)