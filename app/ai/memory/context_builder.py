from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.health_memory import HealthMemory
from app.models.health_profile import HealthProfile
from app.models.user import User


class ContextBuilder:
    """
    Builds deterministic, schema-safe user context for AI orchestration.
    """

    @staticmethod
    def build(
        *,
        user_id: int,
        db: Session,
    ) -> Dict[str, Any]:

        user = db.query(User).filter(User.id == user_id).first()
        profile = (
            db.query(HealthProfile)
            .filter(HealthProfile.user_id == user_id)
            .first()
        )

        memories = (
            db.query(HealthMemory)
            .filter(HealthMemory.user_id == user_id)
            .order_by(HealthMemory.created_at.desc())
            .limit(20)
            .all()
        )

        normalized_memories: List[Dict[str, Any]] = []
        for m in memories:
            normalized_memories.append({
                "category": m.category,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            })

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
            } if user else None,

            "profile": {
                "age": profile.age,
                "height": profile.height,
                "weight": profile.weight,
                "goal": profile.goal,
                "experience_level": profile.experience_level,
            } if profile else None,

            "memory": normalized_memories,
        }
