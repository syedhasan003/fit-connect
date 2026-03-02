from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

from app.core.config import settings  # ← single source of truth

SECRET_KEY = settings.SECRET_KEY
ALGORITHM  = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ===== PASSWORD HASHING =====
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ===== TOKEN CREATION =====
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    data MUST include:
    - sub: user.id
    - role: user.role  <-- we add this in login endpoint
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.utcnow()})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ===== TOKEN DECODING =====
def decode_access_token(token: str):
    """
    Decodes the JWT and returns the payload.
    get_current_user will pull sub from this and fetch user from DB.
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload
