"""
snapshot_job.py
===============
Runs at 23:30 UTC daily. Builds an immutable daily snapshot for every active user,
using the existing DailySnapshotService. Snapshots are used by:
  - Health Timeline screen (/vault/health-timeline)
  - DailySnapshotService internal logging
  - Future agent recall (look back at any specific day)
"""

import logging
from datetime import datetime, timezone, date

from app.db.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)


async def run_daily_snapshot():
    """Build end-of-day snapshots for all active users."""
    logger.info("[SnapshotJob] Starting daily snapshot run...")
    db = SessionLocal()
    today = datetime.now(timezone.utc).date()

    try:
        from app.services.daily_snapshot_service import DailySnapshotService
        service = DailySnapshotService()

        users = db.query(User).filter(User.is_active == True).all()
        built = 0
        errors = 0

        for user in users:
            try:
                service.build_snapshot(db=db, user_id=user.id, target_date=today)
                built += 1
            except Exception as e:
                logger.warning(f"[SnapshotJob] Error for user {user.id}: {e}")
                errors += 1
                try:
                    db.rollback()
                except Exception:
                    pass

        logger.info(f"[SnapshotJob] Done — {built} snapshots built, {errors} errors.")

    except Exception as e:
        logger.error(f"[SnapshotJob] Job failed: {e}")
    finally:
        db.close()
