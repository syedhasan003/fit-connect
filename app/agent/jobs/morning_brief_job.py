"""
morning_brief_job.py
====================
Layer 2 — The Daily Agent: Morning Brief Generator.

Runs at 06:30 UTC daily. For each active user:
  1. Reads their last daily_narrative (from narrative_job)
  2. Reads their upcoming workout for today (from active program schedule)
  3. Reads their weekly stats (workouts, nutrition adherence vs TDEE target)
  4. Checks for anomalies (missed 2+ sessions, calorie gap vs plan, weight trend vs goal)
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
    WorkoutSession, SessionStatus, MealLog, BodyWeightLog, WaterLog, DietPlan,
)

logger = logging.getLogger(__name__)

# Weekday abbreviations matching the app's _WEEKDAY_ABBR convention
_WEEKDAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

_BRIEF_PROMPT = """You are Central — an elite AI fitness coach inside FitConnect.
Write a personalised morning brief for this user. Keep it under 200 words.

Format EXACTLY as:
## Good morning{name_part}! ☀️
[1 sentence about yesterday's highlight or honest miss]

**Today's focus:** [what they should do today — specific, reference today's program day if available]

**This week:** [1 stat or trend that matters right now — use real numbers]

**One thing:** [single most important action for today, 1 sentence max]

USER DATA:
{user_data}

Rules:
- Reference REAL numbers from the data (calories, kg, sessions, TDEE, etc.)
- If calorie_gap_vs_target is available, mention it only if > 200 kcal off
- If today_program_day is provided, name it specifically in "Today's focus"
- If weight is trending wrong vs goal (e.g. gaining while cutting), flag it
- If they had a great day yesterday, acknowledge it specifically
- If they missed something, mention it plainly without guilt-tripping
- If anomalies are present, address the most important one
- If no data yet, give a warm encouraging brief and ask them to log their first workout
- Never use generic phrases like "stay consistent" or "keep it up"
- Never say "your TDEE is X" — just use the gap/surplus naturally
"""


def _get_openai_client():
    from openai import OpenAI
    import os
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _get_today_program_day(db, user: User) -> str | None:
    """
    Return the name of today's workout day from the user's active program, or None.
    e.g. "Chest & Shoulders" or "Pull Day"
    """
    try:
        if not hasattr(user, "active_workout_program_id") or not user.active_workout_program_id:
            return None

        from app.models.vault_item import VaultItem
        program = db.query(VaultItem).filter(
            VaultItem.id == user.active_workout_program_id,
            VaultItem.user_id == user.id,
        ).first()
        if not program:
            return None

        days = (program.content or {}).get("days", [])
        if not days:
            return None

        today_abbr = _WEEKDAY_ABBR[datetime.now().weekday()]
        weekday_names_lower = {a.lower() for a in _WEEKDAY_ABBR}

        # Weekday-mode: days named Mon/Tue/… → match today
        uses_weekday_mode = any(
            (d.get("name") or "").strip().lower() in weekday_names_lower
            for d in days
        )
        if uses_weekday_mode:
            for d in days:
                if (d.get("name") or "").strip().lower() == today_abbr.lower():
                    # Return the focus/muscle groups if present, else the day name
                    focus = d.get("focus") or d.get("muscle_groups") or d.get("name")
                    return str(focus) if focus else None
            return None  # rest day

        # Sequential mode: find the day after the last completed workout_session day_number
        last_session = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == user.id,
                WorkoutSession.status == SessionStatus.COMPLETED,
            )
            .order_by(WorkoutSession.completed_at.desc())
            .first()
        )
        last_day_num = getattr(last_session, "day_number", None) or 0
        next_day_idx = last_day_num % len(days)   # 0-based next day
        d = days[next_day_idx]
        focus = d.get("focus") or d.get("muscle_groups") or d.get("name") or f"Day {next_day_idx + 1}"
        return str(focus)

    except Exception as e:
        logger.debug(f"[MorningBrief] program day error: {e}")
        return None


def _build_user_data_summary(db, user: User) -> dict:
    """Collect the data points needed for the morning brief."""
    now = datetime.now(timezone.utc)
    today = now.date()
    week_ago = now - timedelta(days=7)

    data = {
        "name": user.full_name or "there",
        "yesterday_narrative": None,
        "streak_days": 0,
        "sessions_this_week": 0,
        "missed_sessions": 0,
        # Nutrition
        "avg_calories_this_week": 0,
        "calorie_target": None,          # from active diet plan
        "calorie_gap_vs_target": None,   # avg_calories - calorie_target (negative = under)
        # Body
        "latest_weight": None,
        "weight_goal": None,             # "bulk" | "cut" | "maintain"
        "weight_delta_7d": None,         # kg change over last 7 weigh-ins
        # Water
        "water_yesterday": None,
        # Program
        "today_program_day": None,       # "Chest & Shoulders", "Pull Day", etc.
        "active_program_name": None,
        # Anomalies
        "anomalies": [],
    }

    # ── Yesterday's narrative ───────────────────────────────────────────────
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

    # ── Workout stats this week ─────────────────────────────────────────────
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
                s.completed_at and
                day_start <= s.completed_at.replace(tzinfo=timezone.utc) < day_end
                for s in sessions
            )
            if day_session:
                streak += 1
                check_day -= timedelta(days=1)
            else:
                break
        data["streak_days"] = streak
    except Exception as e:
        logger.debug(f"[MorningBrief] sessions error: {e}")

    # ── Active diet plan targets ────────────────────────────────────────────
    try:
        if hasattr(user, "active_diet_plan_id") and user.active_diet_plan_id:
            diet_plan = db.query(DietPlan).filter(DietPlan.id == user.active_diet_plan_id).first()
            if diet_plan and diet_plan.target_calories:
                data["calorie_target"] = diet_plan.target_calories
    except Exception as e:
        logger.debug(f"[MorningBrief] diet plan error: {e}")

    # ── Nutrition this week ─────────────────────────────────────────────────
    try:
        meals = (
            db.query(MealLog)
            .filter(MealLog.user_id == user.id, MealLog.logged_at >= week_ago)
            .all()
        )
        if meals:
            cal_by_day: dict = {}
            for m in meals:
                d = m.logged_at.date()
                cal_by_day[d] = cal_by_day.get(d, 0) + (m.total_calories or 0)
            if cal_by_day:
                avg = round(sum(cal_by_day.values()) / len(cal_by_day))
                data["avg_calories_this_week"] = avg
                if data["calorie_target"]:
                    data["calorie_gap_vs_target"] = avg - data["calorie_target"]
    except Exception as e:
        logger.debug(f"[MorningBrief] nutrition error: {e}")

    # ── Weight + goal ───────────────────────────────────────────────────────
    try:
        weights = (
            db.query(BodyWeightLog)
            .filter(BodyWeightLog.user_id == user.id)
            .order_by(BodyWeightLog.logged_at.desc())
            .limit(7)
            .all()
        )
        if weights:
            data["latest_weight"] = weights[0].weight_kg
            if len(weights) >= 2:
                delta = round(weights[0].weight_kg - weights[-1].weight_kg, 1)
                data["weight_delta_7d"] = delta

        # Derive goal from workout preferences
        try:
            from app.services.preference_manager import get_preferences
            from app.services.body_composition_service import goal_from_prefs
            w_prefs = get_preferences(db, user.id, "workout") or {}
            data["weight_goal"] = goal_from_prefs(w_prefs)
        except Exception:
            pass
    except Exception as e:
        logger.debug(f"[MorningBrief] weight error: {e}")

    # ── Yesterday's water ───────────────────────────────────────────────────
    try:
        water = db.query(WaterLog).filter(
            WaterLog.user_id == user.id,
            WaterLog.date == (today - timedelta(days=1)),
        ).first()
        if water:
            data["water_yesterday"] = {"glasses": water.glasses, "target": water.target_glasses}
    except Exception as e:
        logger.debug(f"[MorningBrief] water error: {e}")

    # ── Today's program day ─────────────────────────────────────────────────
    try:
        data["today_program_day"] = _get_today_program_day(db, user)
    except Exception as e:
        logger.debug(f"[MorningBrief] program day: {e}")

    # ── Active program name ─────────────────────────────────────────────────
    try:
        if hasattr(user, "active_workout_program_id") and user.active_workout_program_id:
            from app.models.vault_item import VaultItem
            prog = db.query(VaultItem).filter(
                VaultItem.id == user.active_workout_program_id,
                VaultItem.user_id == user.id,
            ).first()
            if prog:
                data["active_program_name"] = prog.title or "Active Program"
    except Exception as e:
        logger.debug(f"[MorningBrief] program name: {e}")

    # ── Anomaly detection (now data-driven) ────────────────────────────────
    anomalies = []

    if data["missed_sessions"] >= 2:
        anomalies.append(f"Missed {data['missed_sessions']} sessions this week")

    # Use diet plan target instead of hardcoded 1200 floor
    if data["avg_calories_this_week"] > 0:
        if data["calorie_target"]:
            gap = data["calorie_gap_vs_target"] or 0
            if gap < -500:
                anomalies.append(
                    f"Avg calories {data['avg_calories_this_week']} kcal — "
                    f"{abs(gap)} kcal below your {data['calorie_target']} kcal target"
                )
            elif gap > 600 and data.get("weight_goal") == "cut":
                anomalies.append(
                    f"Avg calories {data['avg_calories_this_week']} kcal — "
                    f"{gap} kcal over target while on a cut"
                )
        elif data["avg_calories_this_week"] < 1200:
            # Fallback when no diet plan is set
            anomalies.append(f"Average daily calories very low: {data['avg_calories_this_week']} kcal")

    if data["water_yesterday"] and data["water_yesterday"]["glasses"] < 3:
        anomalies.append("Very low water intake yesterday")

    # Weight trend vs goal mismatch
    if data["weight_delta_7d"] is not None and data["weight_goal"]:
        delta = data["weight_delta_7d"]
        if data["weight_goal"] == "cut" and delta > 0.3:
            anomalies.append(
                f"Weight up {delta} kg this week but goal is cut — check nutrition"
            )
        elif data["weight_goal"] == "bulk" and delta < -0.2:
            anomalies.append(
                f"Weight down {abs(delta)} kg this week but goal is bulk — may need more calories"
            )

    data["anomalies"] = anomalies
    return data


def _generate_brief(data: dict) -> str:
    """Call GPT to generate the morning brief."""
    import json
    name_part = f", {data['name'].split()[0]}" if data.get("name") and data["name"] != "there" else ""
    user_data_str = json.dumps(data, indent=2, default=str)
    prompt = _BRIEF_PROMPT.format(name_part=name_part, user_data=user_data_str)

    try:
        client = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=350,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"[MorningBrief] OpenAI error: {e}")
        name = data["name"].split()[0] if data.get("name") else "there"
        day_hint = f" ({data['today_program_day']})" if data.get("today_program_day") else ""
        return (
            f"## Good morning, {name}! ☀️\n"
            f"You've logged {data['sessions_this_week']} session(s) this week — keep the momentum going.\n\n"
            f"**Today's focus:** {data.get('today_program_day', 'your planned workout')}{day_hint}\n\n"
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
                            "calorie_target": data["calorie_target"],
                            "calorie_gap": data["calorie_gap_vs_target"],
                            "latest_weight": data["latest_weight"],
                            "weight_goal": data["weight_goal"],
                            "today_program_day": data["today_program_day"],
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
