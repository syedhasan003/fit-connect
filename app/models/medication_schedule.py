"""
MedicationSchedule — one schedule per session (e.g. "Morning tablets", "Night tablets").
Each schedule carries a JSON list of tablets and an optional emergency contact.

MedicationLog — per-day log of which tablets were taken/missed.
The escalation system reads these logs to decide when to fire repeat alerts
and when to notify the emergency contact.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.database import Base


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Display name — e.g. "Morning tablets", "Post-dinner meds"
    name    = Column(String, nullable=False)

    # 24h time string — "08:00", "21:30"
    scheduled_time = Column(String, nullable=False)

    # Recurrence: daily | specific (days JSON)
    recurrence      = Column(String, nullable=False, default="daily")
    recurrence_days = Column(Text, nullable=True)   # JSON: ["mon","wed","fri"]

    # JSON array: [{name, dosage, instructions, color?}, ...]
    # e.g. [{"name": "Metformin", "dosage": "500mg", "instructions": "with food"}]
    tablets = Column(Text, nullable=False, default="[]")

    is_active = Column(Boolean, default=True)

    # Escalation config
    escalation_interval_mins = Column(Integer, default=5)   # re-notify every N minutes
    max_escalations          = Column(Integer, default=3)    # before contacting emergency contact

    # Emergency contact — notified if all escalations pass with no response
    emergency_contact_name     = Column(String, nullable=True)
    emergency_contact_phone    = Column(String, nullable=True)
    emergency_contact_relation = Column(String, nullable=True)  # "daughter", "son", "spouse"

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class MedicationLog(Base):
    """Daily check-in log for a medication schedule."""
    __tablename__ = "medication_logs"

    id          = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("medication_schedules.id"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Date the log applies to — "YYYY-MM-DD"
    log_date = Column(String, nullable=False, index=True)

    # JSON dict: {"Metformin 500mg": true, "Aspirin 75mg": false, ...}
    tablets_status = Column(Text, nullable=False, default="{}")

    # Escalation tracking
    escalation_count  = Column(Integer, default=0)
    contact_alerted   = Column(Boolean, default=False)
    fully_acknowledged = Column(Boolean, default=False)  # all tablets ticked

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
