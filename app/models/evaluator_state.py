from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func

from app.db.database import Base


class EvaluatorState(Base):
    __tablename__ = "evaluator_states"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Primary evaluator outputs
    focus = Column(String, nullable=False)  
    # workout | diet | recovery | discipline | idle

    consistency_score = Column(Integer, nullable=False, default=0)
    # 0 – 100

    missed_reminders = Column(Integer, default=0)

    pending_tasks = Column(JSON, default={})
    # example:
    # { "workout": true, "diet": false, "reminders": 1 }

    ai_summary = Column(Text, nullable=True)
    # One-liner insight for Home

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
