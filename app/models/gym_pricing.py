from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.database import Base

class GymPricing(Base):
    __tablename__ = "gym_pricing"

    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)

    plan_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    duration = Column(String, nullable=False)  # monthly | quarterly | yearly
