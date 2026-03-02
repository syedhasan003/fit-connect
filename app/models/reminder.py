from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Human-readable title
    title   = Column(String, nullable=True)

    # Category: workout | meal | medication | checkup | other
    type    = Column(String, index=True, nullable=True)

    # Full reminder message / body text
    message = Column(String, nullable=True)

    # When to fire — stored as UTC
    scheduled_at = Column(DateTime, nullable=False)

    # Recurrence: once | daily | weekly | biweekly | monthly | specific | custom
    recurrence          = Column(String, nullable=True, default="once")
    # JSON array of day abbreviations: ["mon","wed","fri"] — used when recurrence="specific"
    recurrence_days     = Column(Text, nullable=True)
    # For custom interval: every N days
    recurrence_interval = Column(Integer, nullable=True)

    # JSON blob for category-specific data:
    #  workout  → {workout_name, program_day, pre_workout_supplement}
    #  meal     → {meal_type, supplements: [{name, dosage, time}]}
    #  checkup  → {doctor, facility, location, appointment_type, has_health_records}
    #  other    → {custom_name}
    category_meta = Column(Text, nullable=True)

    is_active        = Column(Boolean, default=True)
    consent_required = Column(Boolean, default=True)
    missed_processed = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())
