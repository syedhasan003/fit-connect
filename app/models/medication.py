from sqlalchemy import Column, Integer, String, Time, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    schedule_time = Column(Time, nullable=False)

    active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
