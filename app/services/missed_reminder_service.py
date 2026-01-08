from datetime import datetime
from sqlalchemy.orm import Session

from app.models.reminder import Reminder
from app.models.health_memory import HealthMemory
from app.ai.agents.coach_agent import CoachAgent


def process_missed_reminders(db: Session):
    now = datetime.utcnow()

    reminders = db.query(Reminder).filter(
        Reminder.scheduled_at < now,
        Reminder.is_active == True,
        Reminder.missed_processed == False
    ).all()

    if not reminders:
        return

    coach_agent = CoachAgent()

    for reminder in reminders:
        ai_text = coach_agent.handle_missed_reminder(
            user_id=reminder.user_id,
            reminder_text=reminder.message
        )

        memory = HealthMemory(
            user_id=reminder.user_id,
            category="missed_reminder",
            content=ai_text
        )

        db.add(memory)
        reminder.missed_processed = True

    db.commit()
