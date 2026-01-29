from sqlalchemy import Column, Integer, Date, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class DailyHealthSnapshot(Base):
    __tablename__ = "daily_health_snapshots"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    snapshot_date = Column(Date, nullable=False)

    data = Column(JSON, nullable=False)

    is_final = Column(Integer, default=0)  # 0 = editable, 1 = frozen

    created_at = Column(DateTime(timezone=True), server_default=func.now())
