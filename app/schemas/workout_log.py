from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WorkoutLogCreate(BaseModel):
    workout_type: str
    notes: Optional[str] = None

class WorkoutLogOut(BaseModel):
    id: int
    workout_type: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
