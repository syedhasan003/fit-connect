from pydantic import BaseModel
from datetime import datetime

class WeightLogCreate(BaseModel):
    weight: float

class WeightLogOut(BaseModel):
    id: int
    weight: float
    created_at: datetime

    class Config:
        from_attributes = True
