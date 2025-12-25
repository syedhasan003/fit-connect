from sqlalchemy.orm import Session
from datetime import datetime

from app.models.health_memory import HealthMemory


def persist_health_memory(
    *,
    user_id: int,
    memory_type: str,
    content: dict,
    db: Session,
):
    """
    Persists AI-generated insights into long-term health memory.
    This is used for personalization, recall, and accountability.
    """

    memory = HealthMemory(
        user_id=user_id,
        memory_data={
            "type": memory_type,
            "content": content,
            "created_at": datetime.utcnow().isoformat(),
        },
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return memory
