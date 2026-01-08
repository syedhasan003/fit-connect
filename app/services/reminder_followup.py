from datetime import datetime
from sqlalchemy.orm import Session

from app.models.health_memory import HealthMemory
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog


def trigger_ai_followup(
    db: Session,
    reminder: Reminder,
    reminder_log: ReminderLog
):
    """
    Handles AI memory creation based on reminder outcome.
    This is deterministic (no LLM yet).
    """

    # ACKNOWLEDGED CASE
    if reminder_log.acknowledged:
        memory = HealthMemory(
            user_id=reminder.user_id,
            category="reminder",
            content=f"User acknowledged reminder: {reminder.message}"
        )

        db.add(memory)
        db.commit()
        db.refresh(memory)

        return {
            "status": "memory_saved",
            "memory_id": memory.id,
            "category": "reminder"
        }

    # MISSED CASE (🔥 NEW INTELLIGENCE ENTRY POINT)
    memory = HealthMemory(
        user_id=reminder.user_id,
        category="reminder_missed",
        content=(
            f"User missed reminder: {reminder.message} "
            f"scheduled at {reminder.scheduled_at.isoformat()}"
        )
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return {
        "status": "missed_memory_saved",
        "memory_id": memory.id,
        "category": "reminder_missed"
    }
