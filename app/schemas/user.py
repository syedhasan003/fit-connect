from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.role import Role


# ==== CREATE USER PAYLOAD ====
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[Role] = Role.user  # gym_owner | user  (admin never self-registers)


# ==== USER RESPONSE MODEL ====
class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    role: Role
    onboarding_completed: bool = False

    class Config:
        orm_mode = True
