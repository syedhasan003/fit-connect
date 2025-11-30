# app/models/analytics.py
from sqlalchemy import Column, String, Integer, DateTime, Date, JSON, ForeignKey
from datetime import datetime

from app.database.session import Base


# Raw events table
class GymEvent(Base):
    __tablename__ = "gym_events"

    id = Column(String, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gym.id"))       # ✔ matches your actual Gym table
    user_id = Column(String, nullable=True)

    event_type = Column(String, nullable=False)
    source = Column(String, nullable=True)
    meta = Column(JSON, nullable=True)                  # ✔ changed from metadata → meta

    created_at = Column(DateTime, default=datetime.utcnow)


# Daily aggregated analytics
class GymDailyAnalytics(Base):
    __tablename__ = "gym_daily_analytics"

    id = Column(String, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gym.id"))       # ✔ matches your actual Gym table

    date = Column(Date, nullable=False)
    views = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    leads = Column(Integer, default=0)
    premium_views = Column(Integer, default=0)

    engagement_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
