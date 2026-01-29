from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from app.models.daily_health_snapshot import DailyHealthSnapshot
from app.models.workout_log import WorkoutLog
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.models.health_memory import HealthMemory


FINALIZE_AFTER_DAYS = 3


class DailySnapshotService:
    """
    Builds an immutable, read-only snapshot of a user's health for a given day.
    Central is allowed to update it ONLY within correction window.
    """

    def build_snapshot(
        self,
        db: Session,
        user_id: int,
        target_date: date,
    ) -> DailyHealthSnapshot:

        day_start = datetime.combine(target_date, datetime.min.time())
        day_end = datetime.combine(target_date, datetime.max.time())

        # --------------------------------
        # UPSERT TARGET
        # --------------------------------
        snapshot = (
            db.query(DailyHealthSnapshot)
            .filter(
                DailyHealthSnapshot.user_id == user_id,
                DailyHealthSnapshot.snapshot_date == target_date,
            )
            .first()
        )

        # ⛔ Frozen snapshot cannot be rebuilt
        if snapshot and snapshot.is_final:
            return snapshot

        # --------------------------------
        # WORKOUTS
        # --------------------------------
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

        # --------------------------------
        # REMINDERS
        # --------------------------------
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

        # --------------------------------
        # HEALTH MEMORY EVENTS (FACTS)
        # --------------------------------
        memory_events = (
            db.query(HealthMemory)
            .filter(
                HealthMemory.user_id == user_id,
                HealthMemory.created_at >= day_start,
                HealthMemory.created_at <= day_end,
            )
            .all()
        )

        # --------------------------------
        # AI INSIGHT (deterministic, safe)
        # --------------------------------
        if reminders_missed > 0 and not workout_done:
            ai_insight = "Low adherence today. Missed reminders and no workout logged."
        elif workout_done:
            ai_insight = "Workout completed today. Good consistency."
        else:
            ai_insight = "No major activity logged today."

        # --------------------------------
        # SNAPSHOT STRUCTURE (CANONICAL)
        # --------------------------------
        snapshot_data = {
            "date": target_date.isoformat(),
            "workout": {
                "completed": workout_done,
                "count": len(workouts),
            },
            "diet": {
                "followed": None,  # reserved
            },
            "reminders": {
                "scheduled": reminders_total,
                "missed": reminders_missed,
            },
            "health_events": [
                {
                    "category": m.category,
                    "content": m.content,
                }
                for m in memory_events
            ],
            "ai_insight": ai_insight,
        }

        # --------------------------------
        # CREATE OR UPDATE SNAPSHOT
        # --------------------------------
        if not snapshot:
            snapshot = DailyHealthSnapshot(
                user_id=user_id,
                snapshot_date=target_date,
                data=snapshot_data,
            )
            db.add(snapshot)
        else:
            snapshot.data = snapshot_data

        # --------------------------------
        # FINALIZE AFTER WINDOW
        # --------------------------------
        if target_date < date.today() - timedelta(days=FINALIZE_AFTER_DAYS):
            snapshot.is_final = 1

        db.commit()
        db.refresh(snapshot)

        return snapshot
