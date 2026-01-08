from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from app.models.workout_log import WorkoutLog
from app.models.reminder_log import ReminderLog
from app.models.health_memory import HealthMemory


def get_daily_health_state(
    db: Session,
    user_id: int,
    target_date: date
) -> dict:
    start_dt = datetime.combine(target_date, datetime.min.time())
    end_dt = datetime.combine(target_date, datetime.max.time())

    # Workout status
    workout_log = (
        db.query(WorkoutLog)
        .filter(
            WorkoutLog.user_id == user_id,
            WorkoutLog.created_at >= start_dt,
            WorkoutLog.created_at <= end_dt
        )
        .first()
    )

    workout_status = "completed" if workout_log else "pending"

    # Reminder status
    reminder_logs = (
        db.query(ReminderLog)
        .filter(
            ReminderLog.user_id == user_id,
            ReminderLog.scheduled_for >= start_dt,
            ReminderLog.scheduled_for <= end_dt
        )
        .all()
    )

    reminder_status = {
        "workout": "none",
        "nutrition": "none"
    }

    for log in reminder_logs:
        if log.reminder_type == "workout":
            reminder_status["workout"] = (
                "acknowledged" if log.action_taken else "missed"
            )
        elif log.reminder_type == "nutrition":
            reminder_status["nutrition"] = (
                "acknowledged" if log.action_taken else "missed"
            )

    if workout_status == "pending" and reminder_status["workout"] == "missed":
        workout_status = "missed"

    # Library / memory context (last 48h)
    recent_memory = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == user_id,
            HealthMemory.created_at >= datetime.utcnow() - timedelta(days=2)
        )
        .order_by(HealthMemory.created_at.desc())
        .first()
    )

    library_context = {
        "has_recent_uploads": bool(recent_memory),
        "last_category": recent_memory.category if recent_memory else None
    }

    # Confidence level
    if workout_status == "completed" or reminder_status["workout"] == "acknowledged":
        confidence = "high"
    elif reminder_logs:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "date": target_date.isoformat(),
        "workout_status": workout_status,
        "reminder_status": reminder_status,
        "library_context": library_context,
        "confidence_level": confidence
    }
