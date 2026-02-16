from datetime import datetime
from sqlalchemy.orm import Session
from app.models.reminder import Reminder
from app.services.reminder_evaluator import evaluate_missed_reminders

def check_and_trigger_reminders(db: Session):
    """
    Runs every minute via cron/APScheduler
    Checks if any reminders need to fire NOW
    """
    now = datetime.utcnow()
    
    # Find reminders that should trigger now
    pending = db.query(Reminder).filter(
        Reminder.scheduled_at <= now,
        Reminder.is_active == True,
        Reminder.missed_processed == False,
    ).all()
    
    for reminder in pending:
        # TODO: Send actual notification (push, email, etc)
        send_notification(reminder)
    
    # Also check for missed reminders
    evaluate_missed_reminders(db)