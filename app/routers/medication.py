"""
Medication schedule endpoints.

A MedicationSchedule is a named session (e.g. "Morning tablets") that fires
every day or on specific days.  Each schedule has a list of tablets.
Daily logs track which tablets were taken.
"""
import json
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.medication_schedule import MedicationSchedule, MedicationLog

router = APIRouter(prefix="/medication", tags=["Medication"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _schedule_to_dict(s: MedicationSchedule) -> dict:
    return {
        "id":                          s.id,
        "name":                        s.name,
        "scheduled_time":              s.scheduled_time,
        "recurrence":                  s.recurrence,
        "recurrence_days":             json.loads(s.recurrence_days or "[]"),
        "tablets":                     json.loads(s.tablets or "[]"),
        "is_active":                   bool(s.is_active),
        "escalation_interval_mins":    s.escalation_interval_mins,
        "max_escalations":             s.max_escalations,
        "emergency_contact_name":      s.emergency_contact_name,
        "emergency_contact_phone":     s.emergency_contact_phone,
        "emergency_contact_relation":  s.emergency_contact_relation,
        "created_at":                  s.created_at.isoformat() if s.created_at else None,
    }


def _log_to_dict(log: MedicationLog) -> dict:
    return {
        "id":                  log.id,
        "schedule_id":         log.schedule_id,
        "log_date":            log.log_date,
        "tablets_status":      json.loads(log.tablets_status or "{}"),
        "escalation_count":    log.escalation_count,
        "contact_alerted":     bool(log.contact_alerted),
        "fully_acknowledged":  bool(log.fully_acknowledged),
        "updated_at":          log.updated_at.isoformat() if log.updated_at else None,
    }


# ── CRUD: schedules ───────────────────────────────────────────────────────────

@router.get("/schedules")
def list_schedules(db: Session = Depends(get_db), user=Depends(get_current_user)):
    schedules = (
        db.query(MedicationSchedule)
        .filter(MedicationSchedule.user_id == user.id, MedicationSchedule.is_active == True)
        .order_by(MedicationSchedule.scheduled_time)
        .all()
    )
    return [_schedule_to_dict(s) for s in schedules]


@router.post("/schedules")
def create_schedule(payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    required = ["name", "scheduled_time", "tablets"]
    for f in required:
        if f not in payload:
            raise HTTPException(400, f"Missing field: {f}")

    tablets = payload["tablets"]
    if not isinstance(tablets, list) or len(tablets) == 0:
        raise HTTPException(400, "tablets must be a non-empty list")

    schedule = MedicationSchedule(
        user_id                    = user.id,
        name                       = payload["name"],
        scheduled_time             = payload["scheduled_time"],
        recurrence                 = payload.get("recurrence", "daily"),
        recurrence_days            = json.dumps(payload.get("recurrence_days", [])),
        tablets                    = json.dumps(tablets),
        is_active                  = True,
        escalation_interval_mins   = payload.get("escalation_interval_mins", 5),
        max_escalations            = payload.get("max_escalations", 3),
        emergency_contact_name     = payload.get("emergency_contact_name"),
        emergency_contact_phone    = payload.get("emergency_contact_phone"),
        emergency_contact_relation = payload.get("emergency_contact_relation"),
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return _schedule_to_dict(schedule)


@router.patch("/schedules/{schedule_id}")
def update_schedule(schedule_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(MedicationSchedule).filter(
        MedicationSchedule.id == schedule_id,
        MedicationSchedule.user_id == user.id
    ).first()
    if not s:
        raise HTTPException(404, "Schedule not found")

    for field in ["name", "scheduled_time", "recurrence", "escalation_interval_mins", "max_escalations",
                  "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relation"]:
        if field in payload:
            setattr(s, field, payload[field])
    if "recurrence_days" in payload:
        s.recurrence_days = json.dumps(payload["recurrence_days"])
    if "tablets" in payload:
        s.tablets = json.dumps(payload["tablets"])
    if "is_active" in payload:
        s.is_active = payload["is_active"]

    db.commit()
    db.refresh(s)
    return _schedule_to_dict(s)


@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(MedicationSchedule).filter(
        MedicationSchedule.id == schedule_id,
        MedicationSchedule.user_id == user.id
    ).first()
    if not s:
        raise HTTPException(404, "Schedule not found")
    s.is_active = False
    db.commit()
    return {"status": "deactivated", "id": schedule_id}


# ── Daily logs ────────────────────────────────────────────────────────────────

@router.get("/logs/today")
def get_todays_logs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Return today's log for every active schedule, creating empty logs if missing."""
    today = date.today().isoformat()
    schedules = (
        db.query(MedicationSchedule)
        .filter(MedicationSchedule.user_id == user.id, MedicationSchedule.is_active == True)
        .all()
    )

    result = []
    for s in schedules:
        log = db.query(MedicationLog).filter(
            MedicationLog.schedule_id == s.id,
            MedicationLog.log_date == today,
        ).first()

        if not log:
            # Build an empty log with all tablets set to False
            tablets = json.loads(s.tablets or "[]")
            initial_status = {t["name"]: False for t in tablets}
            log = MedicationLog(
                schedule_id    = s.id,
                user_id        = user.id,
                log_date       = today,
                tablets_status = json.dumps(initial_status),
            )
            db.add(log)
            db.commit()
            db.refresh(log)

        result.append({
            "schedule": _schedule_to_dict(s),
            "log":      _log_to_dict(log),
        })

    return result


@router.post("/logs/{log_id}/take")
def mark_tablet_taken(log_id: int, payload: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """
    Mark one or more tablets as taken (or untaken).
    payload: { tablet_name: bool, ... }
    """
    log = db.query(MedicationLog).filter(
        MedicationLog.id == log_id,
        MedicationLog.user_id == user.id,
    ).first()
    if not log:
        raise HTTPException(404, "Log not found")

    status = json.loads(log.tablets_status or "{}")
    for tablet_name, taken in payload.items():
        status[tablet_name] = bool(taken)

    log.tablets_status = json.dumps(status)
    log.fully_acknowledged = all(status.values()) if status else False
    log.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(log)
    return _log_to_dict(log)


@router.get("/logs/history")
def get_log_history(days: int = 30, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Return the last N days of medication logs for the user."""
    from datetime import timedelta
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    logs = (
        db.query(MedicationLog)
        .filter(MedicationLog.user_id == user.id, MedicationLog.log_date >= cutoff)
        .order_by(MedicationLog.log_date.desc())
        .all()
    )
    return [_log_to_dict(l) for l in logs]
