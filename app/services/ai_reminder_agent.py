from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.reminder import Reminder
from app.models.workout_log import WorkoutLog
from app.models.health_memory import HealthMemory

def create_proactive_reminders(db: Session, user_id: int):
    """
    AI analyzes user behavior and creates reminders proactively
    """
    now = datetime.utcnow()
    
    # Check workout consistency
    recent_workouts = db.query(WorkoutLog).filter(
        WorkoutLog.user_id == user_id,
        WorkoutLog.created_at >= now - timedelta(days=3)
    ).count()
    
    if recent_workouts == 0:
        # User hasn't worked out in 3 days - create gentle reminder
        existing = db.query(Reminder).filter(
            Reminder.user_id == user_id,
            Reminder.type == "workout",
            Reminder.is_active == True
        ).first()
        
        if not existing:
            reminder = Reminder(
                user_id=user_id,
                type="workout",
                message="It's been a few days since your last workout. Ready to get back at it?",
                scheduled_at=now + timedelta(hours=2),
                is_active=True,
                consent_required=False,  # AI-generated, gentle nudge
            )
            db.add(reminder)
            
            # Log to health memory
            memory = HealthMemory(
                user_id=user_id,
                category="ai_action",
                content="AI created proactive workout reminder after 3 days of inactivity"
            )
            db.add(memory)
    
    db.commit()