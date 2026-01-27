from sqlalchemy import Column, Integer, String, Boolean
from app.db.database import Base
from app.models.role import Role 
from sqlalchemy import String

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, nullable=False, default=Role.user.value)