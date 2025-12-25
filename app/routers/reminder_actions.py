from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models.reminder_log import ReminderLog
from app.models.reminder import Reminder
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/reminders/actions", tags=["Reminder Actions"])


@router.post("/{reminder_id}/acknowledge")
def acknowledge_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    log = ReminderLog(
        reminder_id=reminder.id,
        user_id=current_user.id,
        acknowledged=True,
        acknowledged_at=datetime.utcnow(),
    )

    db.add(log)
    db.commit()

    return {"status": "acknowledged"}
