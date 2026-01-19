from sqlalchemy.orm import Session
from typing import Dict, Any

from app.models.health_memory import HealthMemory


def persist_health_memory(
    *,
    user_id: int,
    category: str,
    content: Dict[str, Any],
    db: Session,
    source: str = "ai",
):
    """
    Persist AI-generated insights into long-term health memory.

    Schema-aligned with HealthMemory:
    - category: workout | nutrition | ai_insight | reminder | medical_document
    - source: ai | manual | system | library_upload
    """

    memory = HealthMemory(
        user_id=user_id,
        category=category,
        source=source,
        content=content,
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return memory
