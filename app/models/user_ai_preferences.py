"""
user_ai_preferences.py
Stores locked workout and meal preferences per user.
Once a preference_type is locked, Central skips the onboarding questions
and jumps straight to generation.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.sql import func
from app.db.database import Base


class UserAIPreferences(Base):
    __tablename__ = "user_ai_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # 'workout' | 'meal'
    preference_type = Column(String, nullable=False)

    # The full answers blob, e.g.:
    # workout: {days_per_week, location, goal, experience, injuries}
    # meal:    {diet_type, cuisine, cook_time, allergies, meals_per_day, wake_time, sleep_time}
    data = Column(JSON, nullable=False, default=dict)

    locked_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("user_id", "preference_type", name="uq_user_pref_type"),
    )
