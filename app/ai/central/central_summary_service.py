from sqlalchemy.orm import Session
from datetime import datetime

from app.models.workout_log import WorkoutLog
from app.models.weight_log import WeightLog
from app.models.reminder_log import ReminderLog
from app.models.health_memory import HealthMemory

from app.ai.central.range_resolver import resolve_range
from app.ai.central.time_provider import TimeProvider


class CentralSummaryService:
    """
    Pure intelligence layer.
    NO FastAPI, NO LLM.
    """

    def __init__(self, time_provider: TimeProvider | None = None):
        self.time = time_provider or TimeProvider()

    def summarize(
        self,
        db: Session,
        user_id: int,
        range_label: str = "weekly",
    ) -> dict:

        now = self.time.now()
        start, end, resolved = resolve_range(range_label, now)

        # ---------------------------
        # WORKOUTS
        # ---------------------------
        workouts_completed = db.query(WorkoutLog).filter(
            WorkoutLog.user_id == user_id,
            WorkoutLog.created_at >= start,
            WorkoutLog.created_at <= end
        ).count()

        # ---------------------------
        # REMINDERS
        # ---------------------------
        reminders_ack = db.query(ReminderLog).filter(
            ReminderLog.user_id == user_id,
            ReminderLog.acknowledged == True,
            ReminderLog.created_at >= start,
            ReminderLog.created_at <= end
        ).count()

        reminders_missed = db.query(ReminderLog).filter(
            ReminderLog.user_id == user_id,
            ReminderLog.acknowledged == False,
            ReminderLog.created_at >= start,
            ReminderLog.created_at <= end
        ).count()

        # ---------------------------
        # WEIGHT
        # ---------------------------
        weights = db.query(WeightLog).filter(
            WeightLog.user_id == user_id,
            WeightLog.created_at >= start,
            WeightLog.created_at <= end
        ).order_by(WeightLog.created_at.asc()).all()

        weight_start = weights[0].weight if weights else None
        weight_end = weights[-1].weight if weights else None

        # ---------------------------
        # BEHAVIOR (MEMORY)
        # ---------------------------
        memories = db.query(HealthMemory).filter(
            HealthMemory.user_id == user_id,
            HealthMemory.created_at >= start,
            HealthMemory.created_at <= end
        ).all()

        behavior_signals = [m.category for m in memories]

        return {
            "range": {
                "label": resolved,
                "start": start.isoformat(),
                "end": end.isoformat(),
            },
            "workouts": {
                "completed": workouts_completed,
            },
            "reminders": {
                "acknowledged": reminders_ack,
                "missed": reminders_missed,
            },
            "weight": {
                "start": weight_start,
                "end": weight_end,
            },
            "nutrition": {
                "status": "partial",
                "note": "Calorie tracking not fully implemented yet",
            },
            "behavioral_signals": behavior_signals,
        }
