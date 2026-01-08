from pydantic import BaseModel
from datetime import time

class MedicationCreate(BaseModel):
    name: str
    dosage: str | None = None
    schedule_time: time

class MedicationOut(MedicationCreate):
    id: int
    user_id: int
    active: bool

    class Config:
        orm_mode = True
