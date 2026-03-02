"""
morning_brief_job.py
====================
Layer 2 — The Daily Agent: Morning Brief Generator.

Runs at 06:30 UTC daily. For each active user:
  1. Reads their last daily_narrative (from narrative_job)
  2. Reads their upcoming workout for today (from program schedule)
  3. Reads their weekly stats (workouts, nutrition adherence)
  4. Checks for anomalies (missed 2+ sessions, weight spike, calorie gap)
  5. Generates a personalised morning brief via GPT-4o-mini
  6. Writes the brief to health_memories as category="morning_brief"
  7. Pushes it live via WebSocket if the user is online

The brief is also served to the Home screen via GET /api/agent/morning-brief
"""

import logging
from datetime import datetime, timezone, timedelta

from app.db.database import SessionLocal
from app.models.user import User
from app.models.health_memory import HealthMemory
from app.models.fitness_tracking import (
    WorkoutSession, SessionStatus, MealLog, BodyWeightLog, WaterLog,
)

logger = logging.getLogger(__name__)

_BRIEF_PROMPT = """You are Central — an elite AI fitness coach inside FitConnect.
Write a personalised morning brief for this user. Keep it under 180 words.

Format EXACTLY as:
## Good morning{name_part}! ☀️
[1 sentence about yesterday's highlight or honest miss]

**Today's focus:** [what they should do today — specific, not generic]

**This week:** [1 stat or trend that matters right now]

**One thing:** [single most important action for today, 1 sentence max]

USER DATA:
{user_data}

Rules:
- Reference REAL numbers from the data
- If they had a great day yesterday, acknowledge it specifically
- If they missed something, mention it plainly without guilt-tripping
- If no data yet, give a warm encouraging brief and ask them to log their first workout
- Never use generic phrases like "stay consistent" or "keep it up"
"""


def _get_openai_client():
    from openai import OpenAI
    import os
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _build_user_data_summary(db, user: User) -> dict:
    """Collect the data points needed for the morning brief."""
    now = datetime.now(timezone.utc)
    today = now.date()
    week_ago = now - timedelta(days=7)
    yesterday = now - timedelta(days=1)

    data = {
        "name": user.full_name or "there",
        "yesterday_narrative": None,
        "streak_days": 0,
        "sessions_this_week": 0,
        "missed_sessions": 0,
        "avg_calories_this_week": 0,
        "latest_weight": None,
        "water_yesterday": None,
        "anomalies": [],
        "today_program_hint": None,
    }

    # Yesterday's narrative
    try:
        narrative = (
            db.query(HealthMemory)
            .filter(
                HealthMemory.user_id == user.id,
                HealthMemory.category == "daily_narrative",
            )
            .order_by(HealthMemory.created_at.desc())
            .first()
        )
        if narrative:
            data["yesterday_narrative"] = narrative.content.get("narrative", "")
    except Exception as e:
        logger.debug(f"[MorningBrief] narrative error: {e}")

    # Workout stats this week
    try:
        sessions = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == user.id,
                WorkoutSession.started_at >= week_ago,
            )
            .all()
        )
        completed = [s for s in sessions if s.status == SessionStatus.COMPLETED]
        abandoned = [s for s in sessions if s.status == SessionStatus.ABANDONED]
        data["sessions_this_week"] = len(completed)
        data["missed_sessions"] = len(abandoned)

        # Streak: consecutive days with a completed session
        streak = 0
        check_day = today
        for _ in range(30):
            day_start = datetime.combine(check_day, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            day_session = any(
                s.status == SessionStatus.COMPLETED and
                day_start <= s.completed_at.replace(tzinfo=timezone.utc) < day_end
                for s in sessions
                if s.completed_at
            )
            if day_session:
                streak += 1
                check_day -= timedelta(days=1)
            else:
                break
        data["streak_days"] = streak
    except Exception as e:
        logger.debug(f"[MorningBrief] sessions error: {e}")

    # Nutrition this week
    try:
        meals = (
            db.query(MealLog)
            .filter(MealLog.user_id == user.id, MealLog.logged_at >= week_ago)
            .all()
        )
        if meals:
            # Group by date
            cal_by_day: dict = {}
            for m in meals:
                d = m.logged_at.date()
                cal_by_day[d] = cal_by_day.get(d, 0) + (m.total_calories or 0)
            if cal_by_day:
                data["avg_calories_this_week"] = round(sum(cal_by_day.values()) / len(cal_by_day))
    except Exception as e:
        logger.debug(f"[MorningBrief] nutrition error: {e}")

    # Latest weight
    try:
        w = (
            db.query(BodyWeightLog)
            .filter(BodyWeightLog.user_id == user.id)
            .order_by(BodyWeightLog.logged_at.desc())
            .first()
        )
        if w:
            data["latest_weight"] = w.weight_kg
    except Exception as e:
        logger.debug(f"[MorningBrief] weight error: {e}")

    # Yesterday's water
    try:
        water = db.query(WaterLog).filter(
            WaterLog.user_id == user.id,
            WaterLog.date == (today - timedelta(days=1)),
        ).first()
        if water:
            data["water_yesterday"] = {"glasses": water.glasses, "target": water.target_glasses}
    except Exception as e:
        logger.debug(f"[MorningBrief] water error: {e}")

    # Anomaly detection
    anomalies = []
    if data["missed_sessions"] >= 2:
        anomalies.append(f"Missed {data['missed_sessions']} sessions this week")
    if data["avg_calories_this_week"] > 0 and data["avg_calories_this_week"] < 1200:
        anomalies.append(f"Average daily calories very low: {data['avg_calories_this_week']} kcal")
    if data["water_yesterday"] and data["water_yesterday"]["glasses"] < 3:
        anomalies.append("Very low water intake yesterday")
    data["anomalies"] = anomalies

    return data


def _generate_brief(data: dict) -> str:
    """Call GPT-4o-mini to generate the morning brief."""
    import json
    name_part = f", {data['name'].split()[0]}" if data.get("name") and data["name"] != "there" else ""
    user_data_str = json.dumps(data, indent=2, default=str)
    prompt = _BRIEF_PROMPT.format(name_part=name_part, user_data=user_data_str)

    try:
        client = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"[MorningBrief] OpenAI error: {e}")
        # Fallback brief
        name = data["name"].split()[0] if data.get("name") else "there"
        return (
            f"## Good morning, {name}! ☀️\n"
            f"Ready to make today count? You've logged {data['sessions_this_week']} session(s) "
            f"this week.\n\n"
            f"**One thing:** Open the app and log your first activity of the day."
        )


async def run_morning_brief():
    """
    Main scheduler job. Generates and stores morning briefs for all active users.
    Pushes live to any user currently connected via WebSocket.
    """
    logger.info("[MorningBrief] Starting morning brief generation run...")
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        from app.agent.notification_manager import notif_manager

        users = db.query(User).filter(User.is_active == True).all()
        generated = 0

        for user in users:
            try:
                # Skip if brief already generated today (within 2 hours)
                existing = (
                    db.query(HealthMemory)
                    .filter(
                        HealthMemory.user_id == user.id,
                        HealthMemory.category == "morning_brief",
                    )
                    .order_by(HealthMemory.created_at.desc())
                    .first()
                )
                if existing:
                    age = (now - existing.created_at.replace(tzinfo=timezone.utc)).total_seconds()
                    if age < 7200:
                        continue

                data = _build_user_data_summary(db, user)
                brief_text = _generate_brief(data)

                # Store in health_memories
                memory = HealthMemory(
                    user_id=user.id,
                    category="morning_brief",
                    source="system",
                    content={
                        "date": now.strftime("%Y-%m-%d"),
                        "brief": brief_text,
                        "stats": {
                            "streak_days": data["streak_days"],
                            "sessions_this_week": data["sessions_this_week"],
                            "avg_calories": data["avg_calories_this_week"],
                            "latest_weight": data["latest_weight"],
                            "anomalies": data["anomalies"],
                        },
                    },
                )
                db.add(memory)
                db.commit()
                generated += 1

                # Push to WebSocket if online
                await notif_manager.push(user.id, {
                    "type": "morning_brief",
                    "title": "Your morning brief is ready",
                    "body": brief_text[:120] + "…" if len(brief_text) > 120 else brief_text,
                    "data": {"full_brief": brief_text},
                })

            except Exception as e:
                logger.warning(f"[MorningBrief] Error for user {user.id}: {e}")
                try:
                    db.rollback()
                except Exception:
                    pass

        logger.info(f"[MorningBrief] Done — {generated} briefs generated.")

    except Exception as e:
        logger.error(f"[MorningBrief] Job failed: {e}")
    finally:
        db.close()
