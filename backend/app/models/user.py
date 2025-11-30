from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # core auth fields
    email: str = Field(index=True, unique=True, nullable=False)
    password_hash: str

    # premium profile fields
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    fitness_goal: Optional[str] = None