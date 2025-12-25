from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.schemas.reminder import ReminderCreate
from app.services.reminder_followup import trigger_ai_followup

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.post("/", response_model=dict)
def create_reminder(
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reminder = Reminder(
        user_id=current_user.id,
        type=payload.type,
        message=payload.message,
        scheduled_at=payload.scheduled_at,
        is_active=payload.is_active,
        consent_required=payload.consent_required,
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return {
        "id": reminder.id,
        "type": reminder.type,
        "message": reminder.message,
        "scheduled_at": reminder.scheduled_at,
        "is_active": reminder.is_active,
        "consent_required": reminder.consent_required,
    }


@router.get("/", response_model=list)
def get_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id
    ).all()

    return [
        {
            "id": r.id,
            "type": r.type,
            "message": r.message,
            "scheduled_at": r.scheduled_at,
            "is_active": r.is_active,
            "consent_required": r.consent_required,
        }
        for r in reminders
    ]


@router.post("/{reminder_id}/acknowledge")
def acknowledge_reminder(
    reminder_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    acknowledged = payload.get("acknowledged", False)

    reminder_log = ReminderLog(
        reminder_id=reminder.id,
        user_id=current_user.id,
        acknowledged=acknowledged,
        acknowledged_at=datetime.utcnow(),
    )

    db.add(reminder_log)
    db.commit()
    db.refresh(reminder_log)

    ai_result = trigger_ai_followup(
        db=db,
        reminder=reminder,
        reminder_log=reminder_log
    )

    return {
        "status": "acknowledged" if acknowledged else "missed",
        "reminder_id": reminder.id,
        "log_id": reminder_log.id,
        "ai_followup": ai_result
    }
