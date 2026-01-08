from pydantic import BaseModel
from typing import Optional

class GymTrainerOut(BaseModel):
    id: int
    name: str
    specialization: Optional[str] = None
    experience_years: int
    certifications: Optional[str] = None

    class Config:
        from_attributes = True
