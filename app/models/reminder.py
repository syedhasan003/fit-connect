from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    type = Column(String, index=True)
    # medication, meal, workout, checkup

    message = Column(String, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)

    is_active = Column(Boolean, default=True)
    consent_required = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    missed_processed = Column(Boolean, default=False) 