from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    diabetes = Column(Boolean, default=False)
    hypertension = Column(Boolean, default=False)
    thyroid = Column(Boolean, default=False)
    pcos = Column(Boolean, default=False)
    asthma = Column(Boolean, default=False)

    other_conditions = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)

    consent_given = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
