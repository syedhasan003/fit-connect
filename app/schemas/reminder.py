from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReminderCreate(BaseModel):
    type: str
    message: str
    scheduled_at: datetime
    is_active: bool = True
    consent_required: bool = False


class ReminderUpdate(BaseModel):
    type: Optional[str] = None
    message: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    consent_required: Optional[bool] = None


class ReminderResponse(BaseModel):
    id: int
    type: str
    message: str
    scheduled_at: datetime
    is_active: bool
    consent_required: bool

    class Config:
        from_attributes = True
