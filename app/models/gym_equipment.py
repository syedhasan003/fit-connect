from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class GymEquipment(Base):
    __tablename__ = "gym_equipment"

    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)

    equipment_name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # cardio | strength | free_weights
    quantity = Column(Integer, default=1)
