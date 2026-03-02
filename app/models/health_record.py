"""
HealthRecord — a user's complete medical history in one place.

Supports all types of records: blood reports, X-rays, prescriptions,
vaccinations, surgery notes, dental, eye, and custom entries.

File attachments are stored as a JSON array of paths under /static/health_records/{user_id}/
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.sql import func
from app.db.database import Base


class HealthRecord(Base):
    __tablename__ = "health_records"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Date of the record (appointment/test date, not upload date)
    record_date = Column(Date, nullable=False)

    # Type: blood_report | prescription | xray | scan | vaccination |
    #        surgery | dental | eye | doctor_note | other
    record_type = Column(String, nullable=False, index=True)

    # Human-readable title — e.g. "Annual Blood Panel", "Chest X-Ray"
    title = Column(String, nullable=False)

    # Who ordered/gave this
    doctor_name   = Column(String, nullable=True)
    facility_name = Column(String, nullable=True)   # hospital / clinic / lab

    # Free-form notes (doctor's observations, user notes)
    notes = Column(Text, nullable=True)

    # JSON array of uploaded file paths (relative to /static/)
    # e.g. ["health_records/3/2024-01-15_blood_panel.pdf", ...]
    file_paths = Column(Text, nullable=True, default="[]")

    # JSON array of searchable tags — ["diabetes", "blood pressure", "thyroid"]
    tags = Column(Text, nullable=True, default="[]")

    # For structured blood reports: JSON key-value pairs of extracted metrics
    # e.g. {"HbA1c": "5.8%", "Glucose": "95 mg/dL", "Vitamin D": "18 ng/mL"}
    extracted_values = Column(Text, nullable=True)

    # Linked to a checkup reminder?
    linked_reminder_id = Column(Integer, ForeignKey("reminders.id"), nullable=True)

    is_archived = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
