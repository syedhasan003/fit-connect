from datetime import date, datetime
from sqlalchemy.orm import Session

from app.models.daily_health_snapshot import DailyHealthSnapshot
from app.models.workout_log import WorkoutLog
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.models.health_memory import HealthMemory


class DailySnapshotService:
    """
    Builds an immutable, read-only snapshot of a user's health for a given day.
    """

    def build_snapshot(
        self,
        db: Session,
        user_id: int,
        target_date: date,
    ) -> DailyHealthSnapshot:

        day_start = datetime.combine(target_date, datetime.min.time())
        day_end = datetime.combine(target_date, datetime.max.time())

        # -------------------------------
        # WORKOUTS
        # -------------------------------
        workouts = (
            db.query(WorkoutLog)
            .filter(
                WorkoutLog.user_id == user_id,
                WorkoutLog.created_at >= day_start,
                WorkoutLog.created_at <= day_end,
            )
            .all()
        )

        workout_done = len(workouts) > 0

        # -------------------------------
        # REMINDERS
        # -------------------------------
        reminders_total = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == user_id,
                Reminder.scheduled_at >= day_start,
                Reminder.scheduled_at <= day_end,
            )
            .count()
        )

        reminders_missed = (
            db.query(ReminderLog)
            .filter(
                ReminderLog.user_id == user_id,
                ReminderLog.acknowledged == False,
                ReminderLog.created_at >= day_start,
                ReminderLog.created_at <= day_end,
            )
            .count()
        )

        # -------------------------------
        # BEHAVIOUR / MEMORY SIGNALS
        # -------------------------------
        behaviour_events = (
            db.query(HealthMemory)
            .filter(
                HealthMemory.user_id == user_id,
                HealthMemory.created_at >= day_start,
                HealthMemory.created_at <= day_end,
            )
            .count()
        )

        # -------------------------------
        # AI INSIGHT (deterministic)
        # -------------------------------
        if reminders_missed > 0 and not workout_done:
            ai_insight = "Low adherence today. Missed reminders and no workout logged."
        elif workout_done:
            ai_insight = "Workout completed today. Good consistency."
        else:
            ai_insight = "No major activity logged today."

        snapshot_data = {
            "date": target_date.isoformat(),
            "workout": {
                "completed": workout_done,
                "count": len(workouts),
            },
            "diet": {
                "followed": None,
            },
            "reminders": {
                "scheduled": reminders_total,
                "missed": reminders_missed,
            },
            "behaviour_events": behaviour_events,
            "ai_insight": ai_insight,
        }

        # -------------------------------
        # UPSERT (IMMUTABLE LOGIC OK FOR NOW)
        # -------------------------------
        snapshot = (
            db.query(DailyHealthSnapshot)
            .filter(
                DailyHealthSnapshot.user_id == user_id,
                DailyHealthSnapshot.date == target_date,   # ✅ FIXED
            )
            .first()
        )

        if not snapshot:
            snapshot = DailyHealthSnapshot(
                user_id=user_id,
                date=target_date,
                data=snapshot_data,
            )
            db.add(snapshot)
        else:
            snapshot.data = snapshot_data

        db.commit()
        db.refresh(snapshot)

        return snapshot
