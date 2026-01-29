from sqlalchemy.orm import Session
from datetime import date

from app.models.daily_health_snapshot import DailyHealthSnapshot
from app.models.health_memory import HealthMemory

class HealthTimelineService:
    """
    Read-only timeline for Vault.
    Canonical health truth.
    """

    def get_timeline(
        self,
        db: Session,
        user_id: int,
        limit: int = 30,
    ):
        snapshots = (
            db.query(DailyHealthSnapshot)
            .filter(DailyHealthSnapshot.user_id == user_id)
            .order_by(DailyHealthSnapshot.date.desc())
            .limit(limit)
            .all()
        )

        timeline = []

        for snap in snapshots:
            memories = (
                db.query(HealthMemory)
                .filter(
                    HealthMemory.user_id == user_id,
                    HealthMemory.created_at >= snap.date,
                )
                .all()
            )

            timeline.append({
                "date": snap.date.isoformat(),
                "snapshot": snap.data,
                "signals": [
                    {
                        "category": m.category,
                        "content": m.content,
                        "source": m.source,
                        "created_at": m.created_at,
                    }
                    for m in memories
                ],
            })

        return timeline
