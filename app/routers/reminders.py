from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Optional
import json
import calendar

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.schemas.reminder import ReminderCreate, ReminderUpdate
from app.services.reminder_followup import trigger_ai_followup

router = APIRouter(prefix="/reminders", tags=["Reminders"])


# -------------------------------------------------
# RECURRENCE ENGINE
# -------------------------------------------------
_WEEKDAY_MAP = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}

def _next_occurrence(
    scheduled_at: datetime,
    recurrence: Optional[str],
    recurrence_days: Optional[str],
    recurrence_interval: Optional[int],
) -> Optional[datetime]:
    """
    Calculate the next scheduled_at for a recurring reminder.
    Returns None if recurrence is 'once' or unrecognised.

    Recurrence types:
      once       → no next occurrence
      daily      → same time next day
      weekly     → same time next week
      biweekly   → same time in 2 weeks
      monthly    → same time same-ish day next month (clamped to month-end)
      specific   → recurrence_days JSON array e.g. ["mon","wed","fri"]
      custom     → recurrence_interval days later
    """
    if not recurrence or recurrence == "once":
        return None

    # Make timezone-aware (assume UTC if naive)
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

    if recurrence == "daily":
        return scheduled_at + timedelta(days=1)

    elif recurrence == "weekly":
        return scheduled_at + timedelta(weeks=1)

    elif recurrence == "biweekly":
        return scheduled_at + timedelta(weeks=2)

    elif recurrence == "monthly":
        month = scheduled_at.month + 1
        year = scheduled_at.year
        if month > 12:
            month = 1
            year += 1
        # Clamp day to the actual max day of the target month
        max_day = calendar.monthrange(year, month)[1]
        day = min(scheduled_at.day, max_day)
        return scheduled_at.replace(year=year, month=month, day=day)

    elif recurrence == "specific" and recurrence_days:
        try:
            days = json.loads(recurrence_days)  # e.g. ["mon","wed","fri"]
            target_weekdays = sorted(
                [_WEEKDAY_MAP[d.lower()] for d in days if d.lower() in _WEEKDAY_MAP]
            )
            if not target_weekdays:
                return None
            current_weekday = scheduled_at.weekday()
            # Find the next weekday strictly after today
            for wd in target_weekdays:
                if wd > current_weekday:
                    return scheduled_at + timedelta(days=(wd - current_weekday))
            # All target days are earlier in the week — wrap to next week
            first_wd = target_weekdays[0]
            days_until = (7 - current_weekday) + first_wd
            return scheduled_at + timedelta(days=days_until)
        except Exception:
            return None

    elif recurrence == "custom" and recurrence_interval:
        return scheduled_at + timedelta(days=recurrence_interval)

    return None


def _spawn_next_reminder(db: Session, reminder: Reminder) -> Optional[int]:
    """
    If the reminder recurs, create the next occurrence in the DB and return its ID.
    Returns None for one-off reminders.
    """
    next_dt = _next_occurrence(
        reminder.scheduled_at,
        reminder.recurrence,
        reminder.recurrence_days,
        reminder.recurrence_interval,
    )
    if next_dt is None:
        return None

    next_reminder = Reminder(
        user_id             = reminder.user_id,
        type                = reminder.type,
        title               = reminder.title,
        message             = reminder.message,
        scheduled_at        = next_dt,
        recurrence          = reminder.recurrence,
        recurrence_days     = reminder.recurrence_days,
        recurrence_interval = reminder.recurrence_interval,
        category_meta       = reminder.category_meta,
        is_active           = True,
        consent_required    = reminder.consent_required,
        missed_processed    = False,
    )
    db.add(next_reminder)
    db.flush()   # get the ID without a full commit
    return next_reminder.id


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
        user_id             = current_user.id,
        type                = payload.type,
        title               = payload.title or payload.message,
        message             = payload.message,
        scheduled_at        = scheduled_at_utc,
        recurrence          = payload.recurrence or "once",
        recurrence_days     = payload.recurrence_days,
        recurrence_interval = payload.recurrence_interval,
        category_meta       = payload.category_meta,
        is_active           = payload.is_active,
        consent_required    = payload.consent_required,
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
# Query params:
#   active_only=true  → only is_active=True rows (default: false = all)
#   history=true      → only inactive rows (for history tab)
# -------------------------------------------------
@router.get("/", response_model=list)
def get_reminders(
    active_only: Optional[bool] = Query(False, description="Return only active reminders"),
    history: Optional[bool] = Query(False, description="Return only inactive (past) reminders"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Reminder).filter(Reminder.user_id == current_user.id)

    if history:
        # History tab: inactive reminders, most recent first
        q = q.filter(Reminder.is_active == False).order_by(Reminder.scheduled_at.desc())
    elif active_only:
        q = q.filter(Reminder.is_active == True).order_by(Reminder.scheduled_at.asc())
    else:
        # Default: return all reminders (active + inactive), sorted by time
        q = q.order_by(Reminder.scheduled_at.asc())

    reminders = q.all()

    def _serialize(r):
        return {
            "id":                   r.id,
            "type":                 r.type,
            "title":                r.title,
            "message":              r.message,
            "scheduled_at":         ensure_utc(r.scheduled_at).isoformat(),
            "recurrence":           r.recurrence,
            "recurrence_days":      r.recurrence_days,
            "recurrence_interval":  r.recurrence_interval,
            "category_meta":        r.category_meta,
            "is_active":            r.is_active,
            "missed_processed":     r.missed_processed,
            "consent_required":     r.consent_required,
        }

    return [_serialize(r) for r in reminders]


# -------------------------------------------------
# REMINDER HISTORY (dedicated endpoint)
# Returns inactive reminders for the history tab
# -------------------------------------------------
@router.get("/history", response_model=list)
def get_reminder_history(
    limit: Optional[int] = Query(50, description="Max number of history items"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Returns past/completed/acknowledged reminders for the History tab.
    These are reminders where is_active=False, sorted most recent first.
    """
    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.is_active == False,
        )
        .order_by(Reminder.scheduled_at.desc())
        .limit(limit)
        .all()
    )

    # Build a set of reminder_ids that were explicitly acknowledged by the user
    inactive_ids = [r.id for r in reminders]
    acknowledged_ids = set()
    if inactive_ids:
        logs = (
            db.query(ReminderLog.reminder_id)
            .filter(
                ReminderLog.reminder_id.in_(inactive_ids),
                ReminderLog.acknowledged == True,
            )
            .all()
        )
        acknowledged_ids = {row.reminder_id for row in logs}

    return [
        {
            "id":               r.id,
            "type":             r.type,
            "title":            r.title,
            "message":          r.message,
            "scheduled_at":     ensure_utc(r.scheduled_at).isoformat(),
            "recurrence":       r.recurrence,
            "is_active":        r.is_active,
            "missed_processed": r.missed_processed,
            # "completed" = user acknowledged it; "missed" = user explicitly marked missed or no response
            "status":           "completed" if r.id in acknowledged_ids else "missed",
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
    if payload.title is not None:
        reminder.title = payload.title
    if payload.recurrence is not None:
        reminder.recurrence = payload.recurrence
    if payload.recurrence_days is not None:
        reminder.recurrence_days = payload.recurrence_days
    if payload.recurrence_interval is not None:
        reminder.recurrence_interval = payload.recurrence_interval
    if payload.category_meta is not None:
        reminder.category_meta = payload.category_meta

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

    # Deactivate this occurrence
    reminder.is_active = False
    reminder.missed_processed = True

    log = ReminderLog(
        reminder_id=reminder.id,
        user_id=current_user.id,
        acknowledged=True,
        acknowledged_at=datetime.utcnow(),
    )
    db.add(log)

    # Spawn next occurrence for recurring reminders
    next_reminder_id = _spawn_next_reminder(db, reminder)

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
        "next_reminder_id": next_reminder_id,
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

    # Deactivate this occurrence
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

    # Spawn next occurrence for recurring reminders (even missed ones keep recurring)
    next_reminder_id = _spawn_next_reminder(db, reminder)

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
        "next_reminder_id": next_reminder_id,
        "ai_followup": ai_result,
    }