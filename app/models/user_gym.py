from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class UserGymLink(Base):
    __tablename__ = "user_gym_links"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)

    start_date = Column(DateTime(timezone=True), server_default=func.now())
