from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.evaluator_state import EvaluatorState
from app.models.workout_log import WorkoutLog
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.models.health_memory import HealthMemory


class EvaluatorService:
    """
    Central intelligence evaluator.
    Computes the user's CURRENT state.
    """

    def evaluate_user(self, db: Session, user_id: int) -> EvaluatorState:
        now = datetime.utcnow()

        # -------------------------------
        # Workouts
        # -------------------------------
        recent_workouts = (
            db.query(WorkoutLog)
            .filter(
                WorkoutLog.user_id == user_id,
                WorkoutLog.created_at >= now - timedelta(days=7),
            )
            .count()
        )

        # -------------------------------
        # Reminders
        # -------------------------------
        total_missed = (
            db.query(ReminderLog)
            .filter(
                ReminderLog.user_id == user_id,
                ReminderLog.acknowledged == False,
            )
            .count()
        )

        active_reminders = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == user_id,
                Reminder.is_active == True,
            )
            .count()
        )

        # -------------------------------
        # Pending Tasks
        # -------------------------------
        pending_tasks = {
            "workout": recent_workouts == 0,
            "diet": False,  # will be wired later
            "reminders": active_reminders,
        }

        # -------------------------------
        # Focus Logic (simple but solid)
        # -------------------------------
        if total_missed > 0:
            focus = "discipline"
        elif recent_workouts == 0:
            focus = "workout"
        else:
            focus = "maintenance"

        # -------------------------------
        # Consistency Score
        # -------------------------------
        consistency_score = min(100, recent_workouts * 15)

        # -------------------------------
        # AI Summary (Home-safe)
        # -------------------------------
        if focus == "discipline":
            ai_summary = "You’ve missed reminders recently. Let’s refocus gently."
        elif focus == "workout":
            ai_summary = "You haven’t trained in a few days. A light session could help."
        else:
            ai_summary = "You’re maintaining consistency. Keep going."

        # -------------------------------
        # Upsert EvaluatorState
        # -------------------------------
        state = (
            db.query(EvaluatorState)
            .filter(EvaluatorState.user_id == user_id)
            .first()
        )

        if not state:
            state = EvaluatorState(
                user_id=user_id,
                focus=focus,
                consistency_score=consistency_score,
                missed_reminders=total_missed,
                pending_tasks=pending_tasks,
                ai_summary=ai_summary,
            )
            db.add(state)
        else:
            state.focus = focus
            state.consistency_score = consistency_score
            state.missed_reminders = total_missed
            state.pending_tasks = pending_tasks
            state.ai_summary = ai_summary

        # -------------------------------
        # Mirror into HealthMemory (for AI / Vault)
        # -------------------------------
        memory = HealthMemory(
            user_id=user_id,
            category="evaluator_snapshot",
            content=(
                f"Focus: {focus}. "
                f"Consistency score: {consistency_score}. "
                f"Missed reminders: {total_missed}."
            ),
        )

        db.add(memory)
        db.commit()
        db.refresh(state)

        return state
