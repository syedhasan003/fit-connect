from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class HealthMemory(Base):
    __tablename__ = "health_memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # reminder | workout | nutrition | medical_document | ai_insight
    category = Column(String, nullable=False)

    # manual | library_upload | ai | system
    source = Column(String, default="manual")

    # 🔥 structured memory (AI-ready)
    content = Column(JSON, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
