from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token
from app.models.user import User
from app.services.auth import get_password_hash, verify_password, create_access_token
from app.deps import get_current_user

from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Auth"])


# ===== LOGIN SCHEMA =====
class LoginSchema(BaseModel):
    email: EmailStr
    password: str


# ===== REGISTER =====
@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = get_password_hash(user_in.password)

    # Role is provided by the client (gym_owner | user). Admin can never self-register.
    role = user_in.role.value if user_in.role else "user"
    if role == "admin":
        role = "user"  # safety guard — admins are assigned manually

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed,
        role=role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ===== LOGIN =====
@router.post("/login", response_model=Token)
def login(credentials: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
    })

    return {"access_token": token, "token_type": "bearer"}


# ===== ME ENDPOINT =====
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
