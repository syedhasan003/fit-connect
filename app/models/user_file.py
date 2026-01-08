from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class UserFile(Base):
    __tablename__ = "user_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # image, pdf
    category = Column(String, default="medical")  # medical, prescription, report
    created_at = Column(DateTime(timezone=True), server_default=func.now())
