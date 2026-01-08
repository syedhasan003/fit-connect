from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.user_gym import UserGymLink
from app.models.gym import Gym
from app.models.gym_equipment import GymEquipment
from app.models.gym_amenities import GymAmenities
from app.models.gym_pricing import GymPricing
from app.models.gym_trainer import GymTrainer

from app.models.health_profile import HealthProfile
from app.models.health_memory import HealthMemory
from app.models.reminder_log import ReminderLog


def build_user_context(user_id: int, db: Session) -> dict:
    # -----------------------------
    # Gym context
    # -----------------------------
    user_gym = (
        db.query(UserGymLink)
        .filter(UserGymLink.user_id == user_id)
        .first()
    )

    gym_context = None
    if user_gym:
        gym = db.query(Gym).filter(Gym.id == user_gym.gym_id).first()
        gym_context = {
            "id": gym.id,
            "name": gym.name,
            "equipment": [
                e.equipment_name
                for e in db.query(GymEquipment).filter(GymEquipment.gym_id == gym.id).all()
            ],
            "amenities": [
                key for key, value in vars(
                    db.query(GymAmenities)
                    .filter(GymAmenities.gym_id == gym.id)
                    .first()
                ).items()
                if value is True and not key.startswith("_")
            ] if db.query(GymAmenities).filter(GymAmenities.gym_id == gym.id).first() else [],
            "pricing": [
                {
                    "plan": p.plan_name,
                    "price": p.price,
                    "duration": p.duration,
                }
                for p in db.query(GymPricing).filter(GymPricing.gym_id == gym.id).all()
            ],
            "trainers": [
                {
                    "name": t.name,
                    "specialization": t.specialization,
                    "experience": t.experience_years,
                }
                for t in db.query(GymTrainer).filter(GymTrainer.gym_id == gym.id).all()
            ],
        }

    # -----------------------------
    # Health profile
    # -----------------------------
    health_profile = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == user_id)
        .first()
    )

    # -----------------------------
    # Long-term health memory
    # -----------------------------
    memories = (
        db.query(HealthMemory)
        .filter(HealthMemory.user_id == user_id)
        .order_by(HealthMemory.created_at.desc())
        .limit(20)
        .all()
    )

    memory_context = [
        {
            "data": m.memory_data,
            "created_at": m.created_at.isoformat(),
        }
        for m in memories
    ]

    # -----------------------------
    # Accountability signals (last 7 days)
    # -----------------------------
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    reminder_logs = (
        db.query(ReminderLog)
        .filter(
            ReminderLog.user_id == user_id,
            ReminderLog.created_at >= seven_days_ago
        )
        .all()
    )

    compliance = {
        "acknowledged": sum(1 for r in reminder_logs if r.acknowledged),
        "missed": sum(1 for r in reminder_logs if not r.acknowledged),
    }

    return {
        "gym": gym_context,
        "health_profile": vars(health_profile) if health_profile else None,
        "health_memory": memory_context,
        "compliance_summary": compliance,
    }
