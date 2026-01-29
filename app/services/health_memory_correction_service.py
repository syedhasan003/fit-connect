from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.health_memory import HealthMemory


CORRECTION_WINDOW_DAYS = 3


class HealthMemoryCorrectionService:
    """
    Handles controlled corrections to HealthMemory
    ONLY via Central.
    """

    def correct_memory(
        self,
        db: Session,
        *,
        user_id: int,
        memory_id: int,
        corrected_content: dict,
        source: str = "central",
    ) -> HealthMemory:

        memory = (
            db.query(HealthMemory)
            .filter(
                HealthMemory.id == memory_id,
                HealthMemory.user_id == user_id,
            )
            .first()
        )

        if not memory:
            raise HTTPException(status_code=404, detail="Health memory not found")

        # ⏱ Enforce correction window
        if memory.created_at < datetime.utcnow() - timedelta(days=CORRECTION_WINDOW_DAYS):
            raise HTTPException(
                status_code=403,
                detail="Correction window expired. Memory is immutable.",
            )

        # 🔐 Annotate correction (DO NOT erase history)
        memory.content = {
            **corrected_content,
            "_correction": {
                "corrected_at": datetime.utcnow().isoformat(),
                "source": source,
                "original_created_at": memory.created_at.isoformat(),
            },
        }

        db.commit()
        db.refresh(memory)

        return memory
