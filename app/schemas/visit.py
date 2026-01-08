from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VisitCreate(BaseModel):
    gym_id: int
    user_id: Optional[int] = None

class VisitOut(BaseModel):
    id: int
    gym_id: int
    user_id: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True
