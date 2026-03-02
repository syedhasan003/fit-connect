"""
reminder_job.py
===============
Runs every 1 minute. Checks the reminders table for any that are due
and pushes them to the user via WebSocket. Falls back to persisting in DB
if the user is offline (picked up on next app open).
"""

import logging
from datetime import datetime, timezone, timedelta

from app.db.database import SessionLocal
from app.models.reminder import Reminder

logger = logging.getLogger(__name__)


async def check_and_fire_reminders():
    """
    Finds all active reminders scheduled within the last 2 minutes
    that haven't been fired yet, and delivers them via WebSocket.
    """
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=2)

    try:
        from app.agent.notification_manager import notif_manager

        due = (
            db.query(Reminder)
            .filter(
                Reminder.is_active == True,
                Reminder.scheduled_at >= window_start,
                Reminder.scheduled_at <= now,
                Reminder.missed_processed == False,
            )
            .all()
        )

        for reminder in due:
            try:
                await notif_manager.push(reminder.user_id, {
                    "type": "reminder",
                    "title": "Reminder",
                    "body": reminder.message,
                    "data": {
                        "reminder_id": reminder.id,
                        "reminder_type": reminder.type,
                    },
                })
                # Mark as fired so we don't re-send
                reminder.missed_processed = True
                db.commit()
                logger.info(f"[ReminderJob] Fired reminder {reminder.id} for user {reminder.user_id}")
            except Exception as e:
                logger.warning(f"[ReminderJob] Failed to fire reminder {reminder.id}: {e}")

    except Exception as e:
        logger.error(f"[ReminderJob] Job error: {e}")
    finally:
        db.close()
