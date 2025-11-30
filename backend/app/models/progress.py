from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Progress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_email: str = Field(index=True)

    weight_kg: Optional[float] = None
    body_fat: Optional[float] = None
    notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)