from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class GymTrainer(Base):
    __tablename__ = "gym_trainers"

    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)

    name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    experience_years = Column(Integer, default=0)
    certifications = Column(String, nullable=True)
