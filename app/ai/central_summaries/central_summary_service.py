from datetime import datetime
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.models.health_memory import HealthMemory
from app.models.workout_log import WorkoutLog

from app.ai.central_summaries.engine_core import build_summary_from_events


def build_central_summary(
    *,
    db: Session,
    user_id: int,
    start_date: datetime | str,
    end_date: datetime | str,
    granularity: str = "custom",
) -> Dict:
    """
    Central deterministic aggregation layer.

    RULES:
    - DB access ONLY here
    - Engine receives normalized data ONLY
    - No opinions
    - No LLMs
    """

    # --------------------------------------------------
    # SAFETY: normalize date inputs (boundary fix)
    # --------------------------------------------------
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date)

    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date)

    # --------------------------------------------------
    # WORKOUTS
    # --------------------------------------------------
    workouts = (
        db.query(WorkoutLog)
        .filter(
            WorkoutLog.user_id == user_id,
            WorkoutLog.created_at >= start_date,
            WorkoutLog.created_at <= end_date,
        )
        .all()
    )

    workout_events: List[Dict] = [
        {
            "completed": True,  # presence = completed workout
            "created_at": w.created_at,
        }
        for w in workouts
    ]

    # --------------------------------------------------
    # REMINDERS + LOGS
    # --------------------------------------------------
    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == user_id,
            Reminder.scheduled_at >= start_date,
            Reminder.scheduled_at <= end_date,
        )
        .all()
    )

    reminder_ids = [r.id for r in reminders]

    logs = (
        db.query(ReminderLog)
        .filter(
            ReminderLog.user_id == user_id,
            ReminderLog.reminder_id.in_(reminder_ids),
        )
        .order_by(ReminderLog.created_at.asc())
        .all()
    )

    reminder_events: List[Dict] = []

    for r in reminders:
        related_logs = [l for l in logs if l.reminder_id == r.id]

        if not related_logs:
            reminder_events.append({"status": "missed"})
        else:
            last = related_logs[-1]
            reminder_events.append(
                {
                    "status": "acknowledged" if last.acknowledged else "missed"
                }
            )

    # --------------------------------------------------
    # HEALTH MEMORY (NUTRITION SIGNALS ONLY)
    # --------------------------------------------------
    memories = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == user_id,
            HealthMemory.created_at >= start_date,
            HealthMemory.created_at <= end_date,
        )
        .all()
    )

    nutrition_logs = [
        m for m in memories if m.category == "nutrition"
    ]

    # --------------------------------------------------
    # ENGINE (PURE, DB-FREE LOGIC)
    # --------------------------------------------------
    return build_summary_from_events(
        workouts=workout_events,
        reminders=reminder_events,
        nutrition_logs=nutrition_logs,
        health_memory=memories,
        start_date=start_date,
        end_date=end_date,
        granularity=granularity,
    )
