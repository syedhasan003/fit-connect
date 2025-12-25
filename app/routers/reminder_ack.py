from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog

router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)


# -------------------------------------------------
# ACKNOWLEDGE REMINDER (YES TAP)
# -------------------------------------------------
@router.post("/{reminder_id}/ack")
def acknowledge_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = (
        db.query(Reminder)
        .filter(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id,
        )
        .first()
    )

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    log = ReminderLog(
        user_id=current_user.id,
        reminder_id=reminder_id,
        acknowledged=True,
        acknowledged_at=datetime.utcnow(),
    )

    db.add(log)
    db.commit()

    return {
        "status": "acknowledged",
        "reminder_id": reminder_id,
    }


# -------------------------------------------------
# MARK REMINDER AS MISSED
# -------------------------------------------------
@router.post("/{reminder_id}/missed")
def mark_reminder_missed(
    reminder_id: int,
    reason: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = (
        db.query(Reminder)
        .filter(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id,
        )
        .first()
    )

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    log = ReminderLog(
        user_id=current_user.id,
        reminder_id=reminder_id,
        acknowledged=False,
        missed_reason=reason,
        acknowledged_at=datetime.utcnow(),
    )

    db.add(log)
    db.commit()

    return {
        "status": "missed",
        "reminder_id": reminder_id,
        "reason": reason,
    }
