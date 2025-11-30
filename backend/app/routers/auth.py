from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database.session import get_session
from app.models.user import User
from app.core.auth_deps import get_current_user, pwd_context
from app.auth.token import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(email: str, password: str, session: Session = Depends(get_session)):
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_pw = pwd_context.hash(password)

    # Create user
    user = User(email=email, password_hash=hashed_pw)
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "User created ✅", "user_id": user.id}


@router.post("/login")
def login(email: str, password: str, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/profile")
def profile(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "message": "Profile access granted ✅",
    }

from typing import Optional

@router.put("/profile")
def update_profile(
    full_name: Optional[str] = None,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    fitness_goal: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if full_name is not None:
        current_user.full_name = full_name
    if age is not None:
        current_user.age = age
    if gender is not None:
        current_user.gender = gender
    if fitness_goal is not None:
        current_user.fitness_goal = fitness_goal

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {"message": "Profile updated successfully ✅"}