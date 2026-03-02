from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReminderCreate(BaseModel):
    type:                str
    title:               Optional[str] = None
    message:             Optional[str] = None
    scheduled_at:        datetime
    recurrence:          Optional[str] = "once"
    recurrence_days:     Optional[str] = None   # JSON string: '["mon","wed","fri"]'
    recurrence_interval: Optional[int] = None
    category_meta:       Optional[str] = None   # JSON string with category-specific data
    is_active:           bool = True
    consent_required:    bool = False


class ReminderUpdate(BaseModel):
    type:                Optional[str] = None
    title:               Optional[str] = None
    message:             Optional[str] = None
    scheduled_at:        Optional[datetime] = None
    recurrence:          Optional[str] = None
    recurrence_days:     Optional[str] = None
    recurrence_interval: Optional[int] = None
    category_meta:       Optional[str] = None
    is_active:           Optional[bool] = None
    consent_required:    Optional[bool] = None


class ReminderResponse(BaseModel):
    id:               int
    type:             str
    title:            Optional[str] = None
    message:          Optional[str] = None
    scheduled_at:     datetime
    recurrence:       Optional[str] = "once"
    recurrence_days:  Optional[str] = None
    category_meta:    Optional[str] = None
    is_active:        bool
    consent_required: bool

    class Config:
        from_attributes = True
