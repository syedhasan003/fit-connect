from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class LibraryItem(Base):
    __tablename__ = "library_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # image, pdf
    category = Column(String, default="medical")  # medical, workout, diet

    ai_summary = Column(JSON, nullable=True)  # extracted insights from AI
    created_at = Column(DateTime(timezone=True), server_default=func.now())
