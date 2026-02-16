from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.schemas.reminder import ReminderCreate, ReminderUpdate
from app.services.reminder_followup import trigger_ai_followup

router = APIRouter(prefix="/reminders", tags=["Reminders"])


# -------------------------------------------------
# HELPER: Ensure datetime is UTC and timezone-aware
# -------------------------------------------------
def ensure_utc(dt):
    """Convert datetime to UTC and make it timezone-aware"""
    if dt is None:
        return None

    # If naive, assume it's UTC
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)

    # If already aware, convert to UTC
    return dt.astimezone(timezone.utc)


# -------------------------------------------------
# CREATE REMINDER
# -------------------------------------------------
@router.post("/", response_model=dict)
def create_reminder(
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Ensure scheduled_at is UTC
    scheduled_at_utc = ensure_utc(payload.scheduled_at)

    reminder = Reminder(
        user_id=current_user.id,
        type=payload.type,
        message=payload.message,
        scheduled_at=scheduled_at_utc,
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
        "scheduled_at": ensure_utc(reminder.scheduled_at).isoformat(),
        "is_active": reminder.is_active,
        "consent_required": reminder.consent_required,
    }


# -------------------------------------------------
# LIST REMINDERS
# -------------------------------------------------
@router.get("/", response_model=list)
def get_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id)
        .order_by(Reminder.scheduled_at.asc())
        .all()
    )

    return [
        {
            "id": r.id,
            "type": r.type,
            "message": r.message,
            "scheduled_at": ensure_utc(r.scheduled_at).isoformat(),
            "is_active": r.is_active,
            "consent_required": r.consent_required,
        }
        for r in reminders
    ]


# -------------------------------------------------
# UPDATE REMINDER
# -------------------------------------------------
@router.patch("/{reminder_id}", response_model=dict)
def update_reminder(
    reminder_id: int,
    payload: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
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

    # Update only the fields that were provided
    if payload.type is not None:
        reminder.type = payload.type
    if payload.message is not None:
        reminder.message = payload.message
    if payload.scheduled_at is not None:
        reminder.scheduled_at = ensure_utc(payload.scheduled_at)
    if payload.is_active is not None:
        reminder.is_active = payload.is_active
    if payload.consent_required is not None:
        reminder.consent_required = payload.consent_required

    db.commit()
    db.refresh(reminder)

    return {
        "id": reminder.id,
        "type": reminder.type,
        "message": reminder.message,
        "scheduled_at": ensure_utc(reminder.scheduled_at).isoformat(),
        "is_active": reminder.is_active,
        "consent_required": reminder.consent_required,
    }


# -------------------------------------------------
# DELETE REMINDER
# -------------------------------------------------
@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
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

    db.delete(reminder)
    db.commit()

    return {"status": "deleted", "reminder_id": reminder_id}


# -------------------------------------------------
# ACKNOWLEDGE REMINDER (USER DID IT)
# -------------------------------------------------
@router.post("/{reminder_id}/acknowledge")
def acknowledge_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
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

    # ✅ CRITICAL FIX: Deactivate the reminder
    reminder.is_active = False
    reminder.missed_processed = True

    log = ReminderLog(
        reminder_id=reminder.id,
        user_id=current_user.id,
        acknowledged=True,
        acknowledged_at=datetime.utcnow(),
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    ai_result = trigger_ai_followup(
        db=db,
        reminder=reminder,
        reminder_log=log,
    )

    return {
        "status": "acknowledged",
        "reminder_id": reminder.id,
        "log_id": log.id,
        "ai_followup": ai_result,
    }


# -------------------------------------------------
# MARK REMINDER AS MISSED
# -------------------------------------------------
@router.post("/{reminder_id}/missed")
def mark_reminder_missed(
    reminder_id: int,
    reason: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
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

    # ✅ CRITICAL FIX: Deactivate the reminder
    reminder.is_active = False
    reminder.missed_processed = True

    log = ReminderLog(
        reminder_id=reminder.id,
        user_id=current_user.id,
        acknowledged=False,
        missed_reason=reason,
        acknowledged_at=datetime.utcnow(),
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    ai_result = trigger_ai_followup(
        db=db,
        reminder=reminder,
        reminder_log=log,
    )

    return {
        "status": "missed",
        "reminder_id": reminder.id,
        "reason": reason,
        "ai_followup": ai_result,
    }