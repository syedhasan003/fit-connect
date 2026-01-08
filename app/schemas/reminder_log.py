from pydantic import BaseModel
from datetime import datetime

class ReminderLogOut(BaseModel):
    id: int
    reminder_type: str
    action_taken: bool
    scheduled_for: datetime
    responded_at: datetime | None

    class Config:
        orm_mode = True
