from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.health_memory import HealthMemory
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/reminders/reasoning", tags=["Reminder Reasoning"])


class ReminderReasoningRequest(BaseModel):
    reminder_id: int
    status: str  # completed | missed | delayed
    delay_minutes: Optional[int] = None
    user_note: Optional[str] = None


@router.post("/")
def record_reminder_reasoning(
    payload: ReminderReasoningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Stores reminder behavior for AI reasoning
    """

    content = {
        "reminder_id": payload.reminder_id,
        "status": payload.status,
        "delay_minutes": payload.delay_minutes,
        "user_note": payload.user_note,
    }

    memory = HealthMemory(
        user_id=current_user.id,
        category="reminder_behavior",
        content=str(content),
    )

    db.add(memory)
    db.commit()

    return {
        "status": "reasoning_saved",
        "data": content,
    }
