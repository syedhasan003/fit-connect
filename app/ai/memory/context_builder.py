from datetime import datetime
from sqlalchemy.orm import Session

# DB models (already exist in your project)
from app.models.health_profile import HealthProfile
from app.models.health_memory import HealthMemory
from app.models.reminder import Reminder
from app.models.reminder_log import ReminderLog


class ContextBuilder:
    """
    Builds a unified, long-term user context for AI agents.
    This is the SINGLE source of truth for personalization.
    """

    @staticmethod
    def build(user_id: int, db: Session) -> dict:
        # -------------------------------------------------
        # Health Profile
        # -------------------------------------------------
        health = (
            db.query(HealthProfile)
            .filter(HealthProfile.user_id == user_id)
            .first()
        )

        health_profile = {
            "diabetes": health.diabetes if health else False,
            "hypertension": health.hypertension if health else False,
            "thyroid": health.thyroid if health else False,
            "pcos": health.pcos if health else False,
            "asthma": health.asthma if health else False,
            "other_conditions": health.other_conditions if health else None,
            "doctor_notes": health.doctor_notes if health else None,
            "consent_given": health.consent_given if health else False,
        }

        # -------------------------------------------------
        # Active Reminders
        # -------------------------------------------------
        reminders = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == user_id,
                Reminder.is_active == True
            )
            .all()
        )

        reminder_context = [
            {
                "id": r.id,
                "type": r.type,
                "message": r.message,
                "scheduled_at": r.scheduled_at.isoformat(),
                "consent_required": r.consent_required,
            }
            for r in reminders
        ]

        # -------------------------------------------------
        # Long-Term Health Memory (AI recall)
        # -------------------------------------------------
        memories = (
            db.query(HealthMemory)
            .filter(HealthMemory.user_id == user_id)
            .order_by(HealthMemory.created_at.desc())
            .limit(20)
            .all()
        )

        memory_context = [
            {
                "memory": m.memory_data,
                "created_at": m.created_at.isoformat(),
            }
            for m in memories
        ]

        # -------------------------------------------------
        # Accountability / Reminder Logs (recent)
        # -------------------------------------------------
        reminder_logs = (
            db.query(ReminderLog)
            .filter(ReminderLog.user_id == user_id)
            .order_by(ReminderLog.created_at.desc())
            .limit(10)
            .all()
        )

        accountability = [
            {
                "reminder_id": log.reminder_id,
                "acknowledged": log.acknowledged,
                "acknowledged_at": log.acknowledged_at.isoformat() if log.acknowledged_at else None,
                "missed_reason": log.missed_reason,
            }
            for log in reminder_logs
        ]

        # -------------------------------------------------
        # FINAL CONTEXT PAYLOAD
        # -------------------------------------------------
        return {
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "health_profile": health_profile,
            "active_reminders": reminder_context,
            "health_memory": memory_context,
            "accountability": accountability,
            "memory_enabled": True,
        }
