from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.workout_log import WorkoutLog
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog

router = APIRouter(prefix="/home", tags=["Home"])


@router.get("/overview")
def home_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    # ---- WORKOUT STATUS ----
    workout_done = (
        db.query(WorkoutLog)
        .filter(
            WorkoutLog.user_id == current_user.id,
            WorkoutLog.created_at >= datetime.combine(today, datetime.min.time())
        )
        .count()
        > 0
    )

    # ---- REMINDERS ----
    missed_reminders = (
        db.query(ReminderLog)
        .filter(
            ReminderLog.user_id == current_user.id,
            ReminderLog.acknowledged == False
        )
        .count()
    )

    upcoming_reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.scheduled_at >= datetime.utcnow(),
            Reminder.is_active == True
        )
        .count()
    )

    # ---- CONSISTENCY (LAST 14 DAYS) ----
    start_date = today - timedelta(days=13)
    logs = (
        db.query(WorkoutLog.created_at)
        .filter(
            WorkoutLog.user_id == current_user.id,
            WorkoutLog.created_at >= start_date
        )
        .all()
    )

    days_logged = {log.created_at.date().isoformat() for log in logs}

    consistency = []
    for i in range(14):
        d = start_date + timedelta(days=i)
        consistency.append({
            "date": d.isoformat(),
            "worked_out": d.isoformat() in days_logged
        })

    return {
        "user": {
            "full_name": current_user.full_name,
            "email": current_user.email
        },
        "today": {
            "workout": "completed" if workout_done else "pending",
            "diet": None,
            "reminders": {
                "missed": missed_reminders,
                "upcoming": upcoming_reminders
            }
        },
        "consistency": consistency
    }
