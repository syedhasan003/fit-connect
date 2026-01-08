from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models.reminder import Reminder
from app.models.health_memory import HealthMemory
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminder Behavior"])


@router.post("/{reminder_id}/complete")
def complete_reminder(
    reminder_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allows late completion + behavioral understanding
    """

    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )

    if not reminder:
        return {"error": "Reminder not found"}

    completed_at = datetime.utcnow()
    reason = payload.get("reason", "No reason provided")

    delay_minutes = int(
        (completed_at - reminder.scheduled_at).total_seconds() / 60
    )

    memory_text = f"""
Reminder Type: {reminder.type}
Scheduled At: {reminder.scheduled_at}
Completed At: {completed_at}
Delay (minutes): {delay_minutes}
User Reason: {reason}
"""

    memory = HealthMemory(
        user_id=current_user.id,
        category="reminder_behavior",
        content=memory_text.strip(),
    )

    reminder.completed = True
    reminder.completed_at = completed_at

    db.add(memory)
    db.commit()

    return {
        "status": "completed",
        "delay_minutes": delay_minutes
    }
