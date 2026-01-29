from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date

from app.models.user import User
from app.models.workout_log import WorkoutLog
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.models.evaluator_state import EvaluatorState


class HomeService:
    def build_home(self, db: Session, user: User) -> dict:
        today = date.today()

        # -------------------------
        # WORKOUT STATUS
        # -------------------------
        workout_done = (
            db.query(WorkoutLog)
            .filter(
                WorkoutLog.user_id == user.id,
                WorkoutLog.created_at >= datetime.combine(today, datetime.min.time())
            )
            .count()
            > 0
        )

        # -------------------------
        # REMINDERS
        # -------------------------
        missed_reminders = (
            db.query(ReminderLog)
            .filter(
                ReminderLog.user_id == user.id,
                ReminderLog.acknowledged == False
            )
            .count()
        )

        upcoming_reminders = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == user.id,
                Reminder.scheduled_at >= datetime.utcnow(),
                Reminder.is_active == True
            )
            .count()
        )

        # -------------------------
        # CONSISTENCY (14 DAYS)
        # -------------------------
        start_date = today - timedelta(days=13)
        logs = (
            db.query(WorkoutLog.created_at)
            .filter(
                WorkoutLog.user_id == user.id,
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

        # -------------------------
        # EVALUATOR STATE (NEW)
        # -------------------------
        evaluator = (
            db.query(EvaluatorState)
            .filter(EvaluatorState.user_id == user.id)
            .first()
        )

        evaluator_payload = None
        if evaluator:
            evaluator_payload = {
                "focus": evaluator.focus,
                "consistency_score": evaluator.consistency_score,
                "missed_reminders": evaluator.missed_reminders,
                "pending_tasks": evaluator.pending_tasks,
                "ai_summary": evaluator.ai_summary,
            }

        # -------------------------
        # FINAL HOME PAYLOAD
        # -------------------------
        return {
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
            },
            "evaluator": evaluator_payload,
            "today": {
                "workout": "completed" if workout_done else "pending",
                "diet": None,
                "reminders": {
                    "missed": missed_reminders,
                    "upcoming": upcoming_reminders
                }
            },
            "consistency": consistency,
            "quick_actions": ["workout", "diet", "central"]
        }
