"""
nudge_job.py
============
Layer 3 — Real-Time Nudge Agent.

Runs every 4 hours. For each active user, checks for gaps and behavioural
triggers, then generates and pushes a contextual nudge if warranted.

Nudge triggers:
  T1 — No meal logged in 5+ hours during waking hours → calorie gap nudge
  T2 — Workout due today (based on last session pattern) but not yet done → pre-workout prep
  T3 — Water intake < 50% of target by 3pm → hydration nudge
  T4 — Streak about to break (active streak, no session today, after 6pm) → streak guard

Each nudge is generated via GPT-4o-mini and personalised with real numbers.
A cooldown prevents the same trigger from firing more than once per 8 hours.
"""

import logging
from datetime import datetime, timezone, timedelta

from app.db.database import SessionLocal
from app.models.user import User
from app.models.health_memory import HealthMemory
from app.models.fitness_tracking import MealLog, WorkoutSession, SessionStatus, WaterLog

logger = logging.getLogger(__name__)

_NUDGE_PROMPT = """You are Central — a supportive AI fitness coach.
Write a SHORT, warm nudge notification (max 60 words, 2 sentences).
Be specific about the real numbers. Do NOT be preachy or generic.

Trigger: {trigger_type}
Context: {context}

Output ONLY the notification text. No labels, no quotes."""


def _get_openai_client():
    from openai import OpenAI
    import os
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _recent_nudge_cooldown(db, user_id: int, trigger_type: str, hours: int = 8) -> bool:
    """Returns True if a nudge of this trigger type was sent within the cooldown window."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    existing = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == user_id,
            HealthMemory.category == "nudge_sent",
            HealthMemory.created_at >= since,
        )
        .all()
    )
    for m in existing:
        if m.content.get("trigger_type") == trigger_type:
            return True
    return False


def _record_nudge_sent(db, user_id: int, trigger_type: str, nudge_text: str):
    """Record that a nudge was sent (for cooldown tracking)."""
    memory = HealthMemory(
        user_id=user_id,
        category="nudge_sent",
        source="system",
        content={
            "trigger_type": trigger_type,
            "nudge_text": nudge_text,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    db.add(memory)
    db.commit()


def _generate_nudge_text(trigger_type: str, context: dict) -> str:
    """Generate personalised nudge text via GPT-4o-mini."""
    import json
    ctx_str = json.dumps(context, default=str)
    prompt = _NUDGE_PROMPT.format(trigger_type=trigger_type, context=ctx_str)

    try:
        client = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=100,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"[NudgeJob] OpenAI error: {e}")
        # Fallback static nudges
        fallbacks = {
            "calorie_gap": f"You're behind on calories today — {context.get('hours_since_last_meal', '?')}h since your last meal. Quick protein-rich snack?",
            "workout_due": "Your workout window is coming up. Last session was great — let's keep the momentum.",
            "water_low": f"Only {context.get('glasses', 0)}/{context.get('target', 8)} glasses so far. Grab some water now.",
            "streak_guard": f"You've got a {context.get('streak', 0)}-day streak going. Don't let today break it — even a short session counts.",
        }
        return fallbacks.get(trigger_type, "Time to check in on today's goals.")


async def _check_user_nudges(db, user: User, now: datetime, notif_manager):
    """Run all nudge trigger checks for a single user."""
    hour_utc = now.hour

    # Only nudge during reasonable waking hours (7am–10pm UTC approx)
    if not (7 <= hour_utc <= 22):
        return

    # ── T1: Calorie gap nudge ─────────────────────────────────
    try:
        if not _recent_nudge_cooldown(db, user.id, "calorie_gap"):
            last_meal = (
                db.query(MealLog)
                .filter(MealLog.user_id == user.id)
                .order_by(MealLog.logged_at.desc())
                .first()
            )
            if last_meal:
                hours_since = (now - last_meal.logged_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
            else:
                hours_since = 999  # No meals ever logged

            if hours_since >= 5:
                ctx = {
                    "hours_since_last_meal": round(hours_since, 1),
                    "last_meal_name": last_meal.meal_name if last_meal else "none",
                    "hour_of_day": hour_utc,
                }
                nudge = _generate_nudge_text("calorie_gap", ctx)
                await notif_manager.push(user.id, {
                    "type": "nudge",
                    "title": "🍽 Fuel check",
                    "body": nudge,
                    "data": {"trigger": "calorie_gap"},
                })
                _record_nudge_sent(db, user.id, "calorie_gap", nudge)
    except Exception as e:
        logger.debug(f"[NudgeJob] T1 error user {user.id}: {e}")

    # ── T2: Workout due nudge ─────────────────────────────────
    try:
        if not _recent_nudge_cooldown(db, user.id, "workout_due"):
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            session_today = (
                db.query(WorkoutSession)
                .filter(
                    WorkoutSession.user_id == user.id,
                    WorkoutSession.started_at >= today_start,
                )
                .first()
            )
            if not session_today:
                # Check if they typically work out on this weekday
                weekday = now.weekday()  # 0=Mon
                past_month = now - timedelta(days=28)
                past_sessions = (
                    db.query(WorkoutSession)
                    .filter(
                        WorkoutSession.user_id == user.id,
                        WorkoutSession.status == SessionStatus.COMPLETED,
                        WorkoutSession.completed_at >= past_month,
                    )
                    .all()
                )
                weekday_count = sum(
                    1 for s in past_sessions
                    if s.completed_at and s.completed_at.weekday() == weekday
                )
                # If they've worked out on this day 2+ times in the past month, it's a pattern
                if weekday_count >= 2 and 10 <= hour_utc <= 20:
                    last_session = (
                        db.query(WorkoutSession)
                        .filter(
                            WorkoutSession.user_id == user.id,
                            WorkoutSession.status == SessionStatus.COMPLETED,
                        )
                        .order_by(WorkoutSession.completed_at.desc())
                        .first()
                    )
                    ctx = {
                        "weekday": now.strftime("%A"),
                        "historical_sessions_on_this_day": weekday_count,
                        "last_session_duration": last_session.duration_minutes if last_session else None,
                    }
                    nudge = _generate_nudge_text("workout_due", ctx)
                    await notif_manager.push(user.id, {
                        "type": "nudge",
                        "title": "🏋️ Workout window",
                        "body": nudge,
                        "data": {"trigger": "workout_due"},
                    })
                    _record_nudge_sent(db, user.id, "workout_due", nudge)
    except Exception as e:
        logger.debug(f"[NudgeJob] T2 error user {user.id}: {e}")

    # ── T3: Water nudge ───────────────────────────────────────
    try:
        if not _recent_nudge_cooldown(db, user.id, "water_low") and 13 <= hour_utc <= 16:
            today = now.date()
            water = db.query(WaterLog).filter(
                WaterLog.user_id == user.id, WaterLog.date == today
            ).first()
            if water and water.glasses < (water.target_glasses * 0.5):
                ctx = {"glasses": water.glasses, "target": water.target_glasses, "hour": hour_utc}
                nudge = _generate_nudge_text("water_low", ctx)
                await notif_manager.push(user.id, {
                    "type": "nudge",
                    "title": "💧 Hydration check",
                    "body": nudge,
                    "data": {"trigger": "water_low"},
                })
                _record_nudge_sent(db, user.id, "water_low", nudge)
    except Exception as e:
        logger.debug(f"[NudgeJob] T3 error user {user.id}: {e}")

    # ── T4: Streak guard ──────────────────────────────────────
    try:
        if not _recent_nudge_cooldown(db, user.id, "streak_guard") and 18 <= hour_utc <= 21:
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            session_today = (
                db.query(WorkoutSession)
                .filter(
                    WorkoutSession.user_id == user.id,
                    WorkoutSession.started_at >= today_start,
                )
                .first()
            )
            if not session_today:
                # Calculate current streak
                streak = 0
                check_day = now.date() - timedelta(days=1)  # yesterday
                for _ in range(30):
                    ds = datetime.combine(check_day, datetime.min.time()).replace(tzinfo=timezone.utc)
                    de = ds + timedelta(days=1)
                    had_session = db.query(WorkoutSession).filter(
                        WorkoutSession.user_id == user.id,
                        WorkoutSession.status == SessionStatus.COMPLETED,
                        WorkoutSession.completed_at >= ds,
                        WorkoutSession.completed_at < de,
                    ).first()
                    if had_session:
                        streak += 1
                        check_day -= timedelta(days=1)
                    else:
                        break

                if streak >= 3:  # Only guard meaningful streaks
                    ctx = {"streak": streak, "hour": hour_utc}
                    nudge = _generate_nudge_text("streak_guard", ctx)
                    await notif_manager.push(user.id, {
                        "type": "nudge",
                        "title": f"🔥 {streak}-day streak at risk",
                        "body": nudge,
                        "data": {"trigger": "streak_guard", "streak": streak},
                    })
                    _record_nudge_sent(db, user.id, "streak_guard", nudge)
    except Exception as e:
        logger.debug(f"[NudgeJob] T4 error user {user.id}: {e}")


async def run_nudge_check():
    """Main scheduler job — runs nudge checks for all active users."""
    logger.info("[NudgeJob] Starting nudge check run...")
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        from app.agent.notification_manager import notif_manager
        users = db.query(User).filter(User.is_active == True).all()

        for user in users:
            try:
                await _check_user_nudges(db, user, now, notif_manager)
            except Exception as e:
                logger.warning(f"[NudgeJob] Error for user {user.id}: {e}")

        logger.info(f"[NudgeJob] Done — checked {len(users)} users.")
    except Exception as e:
        logger.error(f"[NudgeJob] Job failed: {e}")
    finally:
        db.close()
