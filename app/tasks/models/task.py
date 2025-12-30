import uuid
from sqlalchemy import (
    Column,
    Date,
    Enum,
    ForeignKey,
    JSON,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.database import Base
from app.tasks.models.enums import TaskType, TaskStatus


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(ForeignKey("users.id"), nullable=False)

    task_type = Column(Enum(TaskType), nullable=False)

    scheduled_for = Column(Date, nullable=False)

    planned_payload = Column(JSON, nullable=True)
    actual_payload = Column(JSON, nullable=True)

    status = Column(Enum(TaskStatus), default=TaskStatus.pending)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
