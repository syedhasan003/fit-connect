from pydantic import BaseModel
from typing import Optional

class HealthProfileBase(BaseModel):
    diabetes: bool = False
    hypertension: bool = False
    thyroid: bool = False
    pcos: bool = False
    asthma: bool = False
    other_conditions: Optional[str] = None
    doctor_notes: Optional[str] = None
    consent_given: bool

class HealthProfileCreate(HealthProfileBase):
    pass

class HealthProfileOut(HealthProfileBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
