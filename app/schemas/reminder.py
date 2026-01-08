from datetime import datetime
from pydantic import BaseModel

class ReminderBase(BaseModel):
    type: str
    message: str
    scheduled_at: datetime
    is_active: bool
    consent_required: bool

class ReminderCreate(ReminderBase):
    pass

class ReminderOut(ReminderBase):
    id: int

    class Config:
        from_attributes = True
