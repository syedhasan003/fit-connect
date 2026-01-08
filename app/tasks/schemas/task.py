from pydantic import BaseModel
from datetime import date
from typing import Optional
from uuid import UUID

from app.tasks.models.enums import TaskType, TaskStatus


class TaskBase(BaseModel):
    task_type: TaskType
    scheduled_for: date
    planned_payload: Optional[dict]


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    actual_payload: Optional[dict]
    status: Optional[TaskStatus]


class TaskOut(TaskBase):
    id: UUID
    status: TaskStatus
    actual_payload: Optional[dict]

    class Config:
        orm_mode = True
