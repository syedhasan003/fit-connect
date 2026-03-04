"""
narrative_job.py
================
Foundation B — Daily narrative memory synthesis.

Runs at 06:00 UTC every day. For each active user:
  1. Queries all raw events from the past 24 hours (workouts, meals, weight, water)
  2. Sends them to GPT-4o-mini with a synthesis prompt
  3. Writes the resulting narrative back into health_memories as category="daily_narrative"

This narrative becomes the PRIMARY source of truth that all other agents read from.
Instead of feeding 50 raw JSON events to the AI, it feeds ONE rich narrative per day.
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

_NARRATIVE_PROMPT = """You are a health data analyst. Below is raw event data for ONE user for the past 24 hours.
Write a 150–250 word narrative summary that:
- States what happened (workouts, meals, weight, water) in plain English
- Calls out wins and misses honestly
- Notes any patterns or anomalies worth flagging
- Is written in third person, past tense ("The user completed...", "They hit their protein goal...")
- Does NOT give advice — just summarises what happened

Output ONLY the narrative. No headers, no bullet points.

RAW DATA:
{raw_data}"""


def _get_openai_client():
    from openai import OpenAI
    import os
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _collect_events(db, user_id: int, since: datetime) -> dict:
    """Collect all raw events for the past 24h for a user."""
    events = {
        "workouts": [],
        "meals": [],
        "weight_entries": [],
        "water": None,
    }

    # Workouts
    try:
        sessions = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == user_id,
                WorkoutSession.started_at >= since,
            )
            .all()
        )
        for s in sessions:
            events["workouts"].append({
                "status": s.status.value if s.status else "unknown",
                "duration_mins": s.duration_minutes or 0,
                "exercises_done": s.completed_exercises_count or 0,
                "exercises_planned": s.planned_exercises_count or 0,
                "energy_start": s.energy_level_start,
                "energy_end": s.energy_level_end,
            })
    except Exception as e:
        logger.debug(f"[Narrative] workouts error user {user_id}: {e}")

    # Meals
    try:
        meals = (
            db.query(MealLog)
            .filter(MealLog.user_id == user_id, MealLog.logged_at >= since)
            .all()
        )
        for m in meals:
            events["meals"].append({
                "meal_name": m.meal_name or "meal",
                "calories": round(m.total_calories or 0),
                "protein_g": round(m.total_protein or 0),
                "carbs_g": round(m.total_carbs or 0),
                "fats_g": round(m.total_fats or 0),
                "followed_plan": m.followed_plan,
                "mood": m.mood.value if m.mood else None,
                "energy": m.energy_level.value if m.energy_level else None,
            })
    except Exception as e:
        logger.debug(f"[Narrative] meals error user {user_id}: {e}")

    # Weight
    try:
        weights = (
            db.query(BodyWeightLog)
            .filter(BodyWeightLog.user_id == user_id, BodyWeightLog.logged_at >= since)
            .all()
        )
        events["weight_entries"] = [{"kg": w.weight_kg, "note": w.note} for w in weights]
    except Exception as e:
        logger.debug(f"[Narrative] weight error user {user_id}: {e}")

    # Water
    try:
        today = datetime.now(timezone.utc).date()
        water = db.query(WaterLog).filter(
            WaterLog.user_id == user_id,
            WaterLog.date == today,
        ).first()
        if water:
            events["water"] = {"glasses": water.glasses, "target": water.target_glasses}
    except Exception as e:
        logger.debug(f"[Narrative] water error user {user_id}: {e}")

    return events


def _has_any_data(events: dict) -> bool:
    return bool(
        events["workouts"] or events["meals"] or
        events["weight_entries"] or events["water"]
    )


def _synthesise_narrative(events: dict) -> str:
    """Call GPT-4o-mini to turn raw events into a readable narrative."""
    import json
    raw_data = json.dumps(events, indent=2, default=str)
    prompt = _NARRATIVE_PROMPT.format(raw_data=raw_data)

    try:
        client = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=400,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"[Narrative] OpenAI error: {e}")
        # Fallback: write a simple structured summary without AI
        parts = []
        if events["workouts"]:
            completed = [w for w in events["workouts"] if w["status"] == "completed"]
            parts.append(f"Completed {len(completed)} workout(s).")
        if events["meals"]:
            total_cal = sum(m["calories"] for m in events["meals"])
            total_p = sum(m["protein_g"] for m in events["meals"])
            parts.append(f"Logged {len(events['meals'])} meal(s), {total_cal} kcal, {total_p}g protein.")
        if events["weight_entries"]:
            parts.append(f"Logged weight: {events['weight_entries'][-1]['kg']} kg.")
        if events["water"]:
            w = events["water"]
            parts.append(f"Water: {w['glasses']}/{w['target']} glasses.")
        return " ".join(parts) if parts else "No activity logged."


async def run_daily_narrative_synthesis():
    """
    Main scheduler job. Iterates all active users and synthesises their
    yesterday narrative. Called at 06:00 UTC — covers the past 24h.
    """
    logger.info("[Narrative] Starting daily synthesis run...")
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)
    date_label = (now - timedelta(hours=1)).strftime("%Y-%m-%d")  # label = yesterday

    try:
        users = db.query(User).filter(User.is_active == True).all()
        processed = 0
        skipped = 0

        for user in users:
            try:
                # Don't re-synthesise if we already did this for today
                existing = (
                    db.query(HealthMemory)
                    .filter(
                        HealthMemory.user_id == user.id,
                        HealthMemory.category == "daily_narrative",
                    )
                    .order_by(HealthMemory.created_at.desc())
                    .first()
                )
                if existing:
                    # Check if it was written today (within last 2h to avoid double-run)
                    age = (now - existing.created_at.replace(tzinfo=timezone.utc)).total_seconds()
                    if age < 7200:
                        skipped += 1
                        continue

                events = _collect_events(db, user.id, since)
                if not _has_any_data(events):
                    skipped += 1
                    continue

                narrative_text = _synthesise_narrative(events)

                memory = HealthMemory(
                    user_id=user.id,
                    category="daily_narrative",
                    source="system",
                    content={
                        "date": date_label,
                        "narrative": narrative_text,
                        "raw_event_counts": {
                            "workouts": len(events["workouts"]),
                            "meals": len(events["meals"]),
                            "weight_entries": len(events["weight_entries"]),
                            "water_logged": events["water"] is not None,
                        },
                    },
                )
                db.add(memory)
                db.commit()
                processed += 1

            except Exception as e:
                logger.warning(f"[Narrative] Error processing user {user.id}: {e}")
                try:
                    db.rollback()
                except Exception:
                    pass

        logger.info(f"[Narrative] Done — {processed} synthesised, {skipped} skipped.")

    except Exception as e:
        logger.error(f"[Narrative] Job failed: {e}")
    finally:
        db.close()
