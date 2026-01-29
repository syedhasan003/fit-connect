from sqlalchemy import Column, Integer, Date, ForeignKey, JSON, UniqueConstraint
from app.db.database import Base

class DailyHealthSnapshot(Base):
    __tablename__ = "daily_health_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)

    # Immutable daily snapshot payload
    data = Column(JSON, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_daily_snapshot"),
    )
