# app/schemas/analytics.py
from datetime import datetime, date
from typing import Optional, Dict
from pydantic import BaseModel


class GymEventIn(BaseModel):
    gym_id: int
    user_id: Optional[str] = None
    event_type: str
    source: Optional[str] = None
    metadata: Optional[Dict] = None


class GymDailyOut(BaseModel):
    date: date
    views: int
    saves: int
    leads: int
    premium_views: int
    engagement_score: float

    class Config:
        from_attributes = True


class GymSummaryOut(BaseModel):
    views: int
    saves: int
    leads: int
    premium_views: int
    engagement_score: float
    trend: str
