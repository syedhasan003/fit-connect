from datetime import datetime
from sqlalchemy.orm import Session

from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog
from app.services.reminder_followup import trigger_ai_followup


def evaluate_missed_reminders(db: Session) -> dict:
    """
    Authoritative reminder evaluator.

    - Time-based truth
    - Creates ReminderLog
    - Triggers AI follow-up
    - Idempotent & safe
    """

    now = datetime.utcnow()

    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.scheduled_at < now,
            Reminder.is_active == True,
            Reminder.missed_processed == False,
        )
        .all()
    )

    processed = 0

    for reminder in reminders:
        existing_log = (
            db.query(ReminderLog)
            .filter(
                ReminderLog.reminder_id == reminder.id,
                ReminderLog.user_id == reminder.user_id,
            )
            .first()
        )

        if existing_log:
            reminder.missed_processed = True
            continue

        log = ReminderLog(
            reminder_id=reminder.id,
            user_id=reminder.user_id,
            acknowledged=False,
            missed_reason="system_auto_missed",
            acknowledged_at=None,
        )

        db.add(log)

        try:
            trigger_ai_followup(
                db=db,
                reminder=reminder,
                reminder_log=log,
            )
        except Exception:
            pass

        reminder.missed_processed = True
        processed += 1

    db.commit()

    return {
        "evaluated_at": now.isoformat(),
        "missed_processed": processed,
    }
