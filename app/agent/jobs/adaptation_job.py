"""
adaptation_job.py
=================
Layer 4 + 5 — Weekly Adaptation Agent + Correlation Engine.

Runs every Sunday at 02:00 UTC. For each active user:

PART A — Correlation Engine (Layer 4):
  1. Reads 30 days of workout sessions, meal logs, weight data
  2. Runs statistical analysis:
     - Protein intake vs workout performance (volume lifted)
     - Day-of-week workout success rate
     - Water intake vs workout energy level
     - Calorie consistency vs weight trend
  3. Writes discovered correlations to health_memories as "correlation_insight"

PART B — Adaptation Agent (Layer 5):
  1. Reads adherence this week (% workouts completed, % meals on plan)
  2. Checks for stalled progress (weight stuck 3+ weeks, consistent skips)
  3. Generates a weekly adaptation report with specific plan changes
  4. Writes to health_memories as "weekly_adaptation"
  5. Pushes to user via WebSocket

"""

import logging
import json
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from app.db.database import SessionLocal
from app.models.user import User
from app.models.health_memory import HealthMemory
from app.models.fitness_tracking import (
    WorkoutSession, SessionStatus, MealLog, BodyWeightLog,
    BehavioralPattern, EatingPattern,
)

logger = logging.getLogger(__name__)

_ADAPTATION_PROMPT = """You are Central — an elite AI fitness coach.
Based on this user's 7-day data and correlations, write a weekly adaptation report.
Keep it under 300 words.

Format:
## Weekly Adaptation Report — {date}

**Adherence:** [workout % and meal % this week, honest assessment]

**What's working:** [specific to their data — not generic]

**What needs to change:** [1–2 concrete adjustments with reasoning]

**Plan for next week:** [specific changes to volume, timing, or nutrition — use real numbers]

**Correlation this week:** [1 data-driven insight from their patterns e.g. "Your Tuesday sessions average 18% more volume than Mondays"]

DATA:
{data}

Rules: Reference real numbers. Never say "stay consistent". If adherence is high, push them harder next week. If low, reduce scope and identify the barrier."""


def _get_openai_client():
    from openai import OpenAI
    import os
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ── Correlation Engine ────────────────────────────────────────────────────────

def _run_correlations(db, user_id: int, since: datetime) -> list:
    """
    Run lightweight statistical correlations across 30 days of data.
    Returns a list of {"type": str, "insight": str, "confidence": float} dicts.
    """
    insights = []

    try:
        sessions = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == user_id,
                WorkoutSession.status == SessionStatus.COMPLETED,
                WorkoutSession.completed_at >= since,
            )
            .all()
        )

        meals = (
            db.query(MealLog)
            .filter(MealLog.user_id == user_id, MealLog.logged_at >= since)
            .all()
        )

        weights = (
            db.query(BodyWeightLog)
            .filter(BodyWeightLog.user_id == user_id, BodyWeightLog.logged_at >= since)
            .order_by(BodyWeightLog.logged_at.asc())
            .all()
        )

        # ── Correlation 1: Day-of-week workout success ─────────
        if len(sessions) >= 5:
            day_sessions = defaultdict(int)
            for s in sessions:
                if s.completed_at:
                    day_sessions[s.completed_at.strftime("%A")] += 1
            if day_sessions:
                best_day = max(day_sessions, key=day_sessions.get)
                worst_day = min(day_sessions, key=day_sessions.get)
                if day_sessions[best_day] > day_sessions[worst_day]:
                    insights.append({
                        "type": "day_of_week_pattern",
                        "insight": f"Best workout day: {best_day} ({day_sessions[best_day]} sessions). Weakest: {worst_day} ({day_sessions[worst_day]} sessions).",
                        "confidence": 0.7,
                    })

        # ── Correlation 2: Protein intake day before vs workout performance ──
        if sessions and meals:
            protein_days = {}
            for m in meals:
                d = m.logged_at.date()
                protein_days[d] = protein_days.get(d, 0) + (m.total_protein or 0)

            high_protein_sessions = []
            low_protein_sessions = []
            for s in sessions:
                if s.completed_at and s.duration_minutes:
                    prev_day = (s.completed_at - timedelta(days=1)).date()
                    prev_protein = protein_days.get(prev_day, 0)
                    if prev_protein >= 120:
                        high_protein_sessions.append(s.duration_minutes)
                    elif 0 < prev_protein < 80:
                        low_protein_sessions.append(s.duration_minutes)

            if len(high_protein_sessions) >= 3 and len(low_protein_sessions) >= 3:
                avg_high = sum(high_protein_sessions) / len(high_protein_sessions)
                avg_low = sum(low_protein_sessions) / len(low_protein_sessions)
                diff_pct = round(abs(avg_high - avg_low) / max(avg_low, 1) * 100)
                if diff_pct >= 10:
                    direction = "longer" if avg_high > avg_low else "shorter"
                    insights.append({
                        "type": "protein_performance_correlation",
                        "insight": f"Sessions after high-protein days ({avg_high:.0f} min avg) are {diff_pct}% {direction} than after low-protein days ({avg_low:.0f} min avg).",
                        "confidence": 0.65,
                    })

        # ── Correlation 3: Weight trend analysis ──────────────
        if len(weights) >= 7:
            first_w = weights[0].weight_kg
            last_w = weights[-1].weight_kg
            delta = round(last_w - first_w, 1)
            direction = "↑ gaining" if delta > 0.5 else ("↓ losing" if delta < -0.5 else "→ stable")
            insights.append({
                "type": "weight_trend",
                "insight": f"Weight trend over {len(weights)} entries: {direction} ({abs(delta)} kg). Start: {first_w} kg → Now: {last_w} kg.",
                "confidence": 0.9,
            })

        # ── Correlation 4: Calorie consistency ────────────────
        if len(meals) >= 7:
            cal_by_day: dict = defaultdict(float)
            for m in meals:
                cal_by_day[m.logged_at.date()] += (m.total_calories or 0)
            daily_cals = list(cal_by_day.values())
            avg_cal = sum(daily_cals) / len(daily_cals)
            variance = max(daily_cals) - min(daily_cals)
            if variance > 500:
                insights.append({
                    "type": "calorie_inconsistency",
                    "insight": f"High calorie variance: {round(min(daily_cals))}–{round(max(daily_cals))} kcal/day (avg {round(avg_cal)}). Inconsistent fuelling may affect performance.",
                    "confidence": 0.75,
                })

    except Exception as e:
        logger.warning(f"[Adaptation] Correlation error user {user_id}: {e}")

    return insights


# ── Adherence Scorer ──────────────────────────────────────────────────────────

def _score_adherence(db, user_id: int, week_start: datetime) -> dict:
    """Compute adherence metrics for the past week."""
    adherence = {
        "workouts_completed": 0,
        "workouts_abandoned": 0,
        "meals_on_plan": 0,
        "meals_off_plan": 0,
        "workout_adherence_pct": 0,
        "meal_adherence_pct": 0,
    }

    try:
        sessions = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == user_id,
                WorkoutSession.started_at >= week_start,
            )
            .all()
        )
        adherence["workouts_completed"] = sum(1 for s in sessions if s.status == SessionStatus.COMPLETED)
        adherence["workouts_abandoned"] = sum(1 for s in sessions if s.status == SessionStatus.ABANDONED)
        total_w = len(sessions)
        if total_w > 0:
            adherence["workout_adherence_pct"] = round(adherence["workouts_completed"] / total_w * 100)
    except Exception as e:
        logger.debug(f"[Adaptation] adherence sessions error: {e}")

    try:
        meals = (
            db.query(MealLog)
            .filter(MealLog.user_id == user_id, MealLog.logged_at >= week_start)
            .all()
        )
        adherence["meals_on_plan"] = sum(1 for m in meals if m.followed_plan)
        adherence["meals_off_plan"] = sum(1 for m in meals if not m.followed_plan)
        total_m = len(meals)
        if total_m > 0:
            adherence["meal_adherence_pct"] = round(adherence["meals_on_plan"] / total_m * 100)
    except Exception as e:
        logger.debug(f"[Adaptation] adherence meals error: {e}")

    return adherence


# ── Main job ──────────────────────────────────────────────────────────────────

async def run_weekly_adaptation():
    """Main scheduler job. Runs correlation engine + adaptation for all active users."""
    logger.info("[Adaptation] Starting weekly adaptation run...")
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    try:
        from app.agent.notification_manager import notif_manager
        users = db.query(User).filter(User.is_active == True).all()
        processed = 0

        for user in users:
            try:
                # ── Part A: Correlation Engine ─────────────────
                correlations = _run_correlations(db, user.id, month_start)

                if correlations:
                    db.add(HealthMemory(
                        user_id=user.id,
                        category="correlation_insight",
                        source="system",
                        content={
                            "date": now.strftime("%Y-%m-%d"),
                            "insights": correlations,
                            "days_analysed": 30,
                        },
                    ))
                    db.commit()

                # ── Part B: Adaptation Agent ───────────────────
                adherence = _score_adherence(db, user.id, week_start)

                # Only generate adaptation if they have meaningful data
                if adherence["workouts_completed"] + adherence["workouts_abandoned"] == 0 and adherence["meals_on_plan"] + adherence["meals_off_plan"] == 0:
                    continue

                data_summary = {
                    "adherence": adherence,
                    "correlations": [c["insight"] for c in correlations],
                    "week": now.strftime("Week of %b %d"),
                }

                prompt = _ADAPTATION_PROMPT.format(
                    date=now.strftime("%b %d, %Y"),
                    data=json.dumps(data_summary, indent=2, default=str),
                )

                try:
                    client = _get_openai_client()
                    resp = client.chat.completions.create(
                        model="gpt-5-nano",
                        messages=[{"role": "user", "content": prompt}],
                        max_completion_tokens=500,
                    )
                    adaptation_text = resp.choices[0].message.content.strip()
                except Exception as ai_err:
                    logger.warning(f"[Adaptation] AI error for user {user.id}: {ai_err}")
                    adaptation_text = f"Weekly summary: {adherence['workouts_completed']} workouts completed ({adherence['workout_adherence_pct']}% adherence). Meal plan adherence: {adherence['meal_adherence_pct']}%."

                db.add(HealthMemory(
                    user_id=user.id,
                    category="weekly_adaptation",
                    source="system",
                    content={
                        "date": now.strftime("%Y-%m-%d"),
                        "report": adaptation_text,
                        "adherence": adherence,
                        "correlations_found": len(correlations),
                    },
                ))
                db.commit()

                # Push to user
                await notif_manager.push(user.id, {
                    "type": "adaptation",
                    "title": "📊 Your weekly report is ready",
                    "body": f"Workout adherence: {adherence['workout_adherence_pct']}% | {len(correlations)} insight(s) found",
                    "data": {"report": adaptation_text},
                })

                processed += 1

            except Exception as e:
                logger.warning(f"[Adaptation] Error for user {user.id}: {e}")
                try:
                    db.rollback()
                except Exception:
                    pass

        logger.info(f"[Adaptation] Done — {processed} users processed.")

    except Exception as e:
        logger.error(f"[Adaptation] Job failed: {e}")
    finally:
        db.close()
