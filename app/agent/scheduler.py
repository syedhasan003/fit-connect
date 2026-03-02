"""
scheduler.py
============
Foundation A — The agent scheduler engine.

Uses APScheduler (AsyncIOScheduler) embedded inside FastAPI's lifespan.
All agent jobs are registered here and run in the background on their own clock.

Timezone: Asia/Kolkata (IST, UTC+5:30) — app is India-first.

Job registry:
  • Every 1 min   — check + fire due reminders
  • Every 4 hrs   — nudge agent (real-time gap detection)
  • 00:00 IST     — daily narrative synthesis (Foundation B)   [18:30 UTC prev day]
  • 03:30 IST     — daily agent / morning brief generation     [22:00 UTC prev day]
  • 02:00 IST Sun — weekly adaptation agent + correlation engine [20:30 UTC Sat]
  • 23:30 IST     — immutable daily health snapshot builder    [18:00 UTC]
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

# IST timezone — all cron jobs fire at Indian Standard Time
IST = "Asia/Kolkata"

# Singleton scheduler — imported everywhere that needs to add jobs
scheduler = AsyncIOScheduler(timezone=IST)


def start_scheduler():
    """Register all agent jobs and start the scheduler. Called once at app startup."""
    if scheduler.running:
        logger.info("[Scheduler] Already running — skipping start.")
        return

    # ──────────────────────────────────────────────
    # 1. Reminder fire check (every 1 minute)
    # ──────────────────────────────────────────────
    from app.agent.jobs.reminder_job import check_and_fire_reminders
    scheduler.add_job(
        check_and_fire_reminders,
        trigger=IntervalTrigger(minutes=1),
        id="reminder_check",
        name="Check & fire due reminders",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=30,
    )

    # ──────────────────────────────────────────────
    # 2. Narrative memory synthesis (00:00 IST — midnight)
    #    Synthesises the previous day's events into a readable narrative.
    # ──────────────────────────────────────────────
    from app.agent.jobs.narrative_job import run_daily_narrative_synthesis
    scheduler.add_job(
        run_daily_narrative_synthesis,
        trigger=CronTrigger(hour=0, minute=0, timezone=IST),
        id="narrative_synthesis",
        name="Daily narrative memory synthesis",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600,
    )

    # ──────────────────────────────────────────────
    # 3. Morning brief (03:30 IST — ready before users wake up)
    #    Generates AI brief from the midnight narrative so it's
    #    waiting on the Home screen by 6–7 AM.
    # ──────────────────────────────────────────────
    from app.agent.jobs.morning_brief_job import run_morning_brief
    scheduler.add_job(
        run_morning_brief,
        trigger=CronTrigger(hour=3, minute=30, timezone=IST),
        id="morning_brief",
        name="Daily morning brief generator",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600,
    )

    # ──────────────────────────────────────────────
    # 4. Real-time nudge agent (every 4 hours)
    # ──────────────────────────────────────────────
    from app.agent.jobs.nudge_job import run_nudge_check
    scheduler.add_job(
        run_nudge_check,
        trigger=IntervalTrigger(hours=4),
        id="nudge_agent",
        name="Real-time nudge agent",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=600,
    )

    # ──────────────────────────────────────────────
    # 5. Weekly adaptation + correlation (Sunday 02:00 IST)
    # ──────────────────────────────────────────────
    from app.agent.jobs.adaptation_job import run_weekly_adaptation
    scheduler.add_job(
        run_weekly_adaptation,
        trigger=CronTrigger(day_of_week="sun", hour=2, minute=0, timezone=IST),
        id="weekly_adaptation",
        name="Weekly adaptation + correlation engine",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600,
    )

    # ──────────────────────────────────────────────
    # 6. Daily snapshot (23:30 IST — end of day)
    #    Locks the day's health snapshot before midnight.
    # ──────────────────────────────────────────────
    from app.agent.jobs.snapshot_job import run_daily_snapshot
    scheduler.add_job(
        run_daily_snapshot,
        trigger=CronTrigger(hour=23, minute=30, timezone=IST),
        id="daily_snapshot",
        name="Daily health snapshot builder",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600,
    )

    scheduler.start()
    logger.info("[Scheduler] ✅ Started (IST) — %d jobs registered.", len(scheduler.get_jobs()))


def stop_scheduler():
    """Gracefully shut down the scheduler. Called on app shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Stopped.")
