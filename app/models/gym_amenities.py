from sqlalchemy import Column, Integer, Boolean, ForeignKey
from app.db.database import Base

class GymAmenities(Base):
    __tablename__ = "gym_amenities"

    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False, unique=True)

    sauna = Column(Boolean, default=False)
    steam = Column(Boolean, default=False)
    ice_bath = Column(Boolean, default=False)
    recovery_room = Column(Boolean, default=False)
    pool = Column(Boolean, default=False)
    parking = Column(Boolean, default=False)
    showers = Column(Boolean, default=False)
    locker = Column(Boolean, default=False)
