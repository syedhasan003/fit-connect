"""
ai_central.py
Central AI Brain — streaming, intent-aware, preference-driven, memory-rich.

Endpoints:
  POST /ai/central/stream          — SSE streaming response (primary)
  POST /ai/central/ask             — Non-streaming fallback (legacy compat)
  GET  /ai/central/preferences/{type}  — Get stored prefs
  POST /ai/central/preferences     — Save/update preferences
  DELETE /ai/central/preferences/{type} — Clear preferences (re-onboard)
  POST /ai/central/dislike         — Log a disliked exercise or food item
  GET  /ai/central/questions/{type} — Get question list for a flow type
"""

import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.health_memory import HealthMemory
from app.models.fitness_tracking import (
    WorkoutSession, SessionStatus, MealLog, BodyWeightLog, WaterLog, DietPlan,
)
from app.models.user import User
from app.services.memory_writer import get_disliked_items, write_disliked_item
from app.services.preference_manager import (
    get_preferences, save_preferences, clear_preferences, get_questions,
)
from app.services.body_composition_service import (
    compute_body_composition, activity_level_from_prefs, goal_from_prefs,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/central", tags=["AI Central"])


# ─────────────────────────────────────────────────────────────
# OpenAI client (lazy async)
# ─────────────────────────────────────────────────────────────

_openai_client = None

def _get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI
        import os
        _openai_client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            timeout=90.0,       # outer wall-clock timeout (streaming can be slow for long plans)
            max_retries=2,      # auto-retry transient 5xx / network errors
        )
    return _openai_client


# ─────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    conversation_history: list = []   # [{role, content}]
    flow_context: dict = {}           # {intent, answers, preferences}


class PreferenceSaveRequest(BaseModel):
    preference_type: str   # 'workout' | 'meal'
    data: dict


class DislikeRequest(BaseModel):
    item_type: str    # 'exercise' | 'food' | 'ingredient'
    item_name: str
    context: str = None


# ─────────────────────────────────────────────────────────────
# Intent detection (keyword matching, zero API cost)
# ─────────────────────────────────────────────────────────────

_INTENT_PATTERNS = {
    "workout": [
        r"create.*workout", r"build.*workout", r"make.*workout", r"generate.*workout",
        r"workout.*plan", r"training.*plan", r"exercise.*plan", r"new.*program",
        r"build.*program", r"create.*program", r"gym.*program", r"workout.*routine",
        r"training.*routine", r"design.*workout", r"new.*routine",
        r"what.*exercises", r"which.*exercises", r"leg.*day", r"chest.*day",
        r"push.*day", r"pull.*day", r"upper.*body", r"lower.*body",
        r"arm.*day", r"back.*day", r"shoulder.*day", r"ab.*workout", r"core.*workout",
        r"cardio.*plan", r"hiit.*plan", r"strength.*program",
    ],
    "meal": [
        r"meal.*plan", r"diet.*plan", r"food.*plan", r"create.*diet",
        r"design.*meal", r"what.*should.*eat", r"nutrition.*plan",
        r"eating.*plan", r"generate.*meal", r"make.*meal.*plan",
        r"meal.*schedule", r"what.*eat", r"food.*today", r"breakfast.*lunch.*dinner",
        r"calorie.*target", r"macro.*target",
        r"how many calories", r"protein.*goal", r"what.*protein", r"bulking.*diet",
        r"cutting.*diet", r"deficit.*calories", r"surplus.*calories",
        r"cheat.*meal", r"refeed", r"intermittent.*fasting",
    ],
    "motivate": [
        r"motivat", r"hype me", r"inspire me", r"i need.*push",
        r"feeling.*lazy", r"don.*want.*workout", r"keep.*going",
        r"encourage", r"pump me up", r"need.*motivation",
        r"struggling", r"want to quit", r"hard.*today", r"not feeling it",
        r"burnout", r"demotivat", r"no energy", r"feel like giving up",
        r"lost.*motivation", r"can.*t be bothered", r"skip.*today",
    ],
    "progress": [
        r"analyz.*progress", r"my progress", r"how.*i.*doing", r"progress.*report",
        r"weekly.*summary", r"show.*stats", r"how.*been.*doing",
        r"progress.*check", r"fitness.*summary", r"my.*stats",
        r"am i improving", r"have i improved", r"results", r"how.*performing",
        r"plateau", r"stuck", r"track.*record", r"trend", r"summary.*week",
        r"look back", r"review.*week", r"how.*training.*going",
    ],
    "reminder": [
        r"set.*reminder", r"remind me", r"create.*reminder",
        r"schedule.*reminder", r"add.*reminder", r"new.*reminder",
        r"reminder.*for", r"alert.*me", r"notify.*me",
        r"remind.*workout", r"remind.*meal", r"remind.*medication",
        r"remind.*medicine", r"remind.*tablet", r"remind.*checkup",
        r"remind.*doctor", r"remind.*appointment",
    ],
    "medication": [
        r"did.*take.*medication", r"did.*take.*medicine", r"did.*take.*tablet",
        r"my.*medication", r"medication.*today", r"tablets.*today",
        r"medication.*schedule", r"my.*pills", r"medicine.*reminder",
        r"check.*medication", r"medication.*log",
    ],
    # ── New intents ───────────────────────────────────────────────────────────
    "recovery": [
        r"sore", r"soreness", r"doms", r"recovery", r"rest.*day",
        r"muscle.*tight", r"stiff", r"fatigue", r"overtrain",
        r"sleep.*bad", r"didn.*sleep", r"exhausted", r"need.*rest",
        r"injury", r"pain.*muscle", r"foam.*roll", r"stretch",
        r"active.*recovery", r"deload", r"how.*recover",
    ],
    "celebration": [
        r"hit.*pr", r"new.*pr", r"personal.*record", r"pb\b", r"personal.*best",
        r"pr today", r"i.*lifted", r"i.*beat", r"nailed.*it",
        r"crushed.*workout", r"best.*session", r"finally.*achieved",
        r"reached.*goal", r"lost.*kg", r"gained.*kg",
        r"smashed", r"killed.*it", r"proud",
    ],
    "check_in": [
        r"^how.*am i\?*$", r"^check in", r"^daily check",
        r"^what.*should.*focus", r"^what.*do today",
        r"where.*am i", r"^update me", r"^brief me",
        r"^how.*looking", r"^what.*next",
    ],
}

# ── Agent routing table: intent → specialist persona label ────────────────────
_INTENT_AGENT = {
    "workout":     "🏋️ Personal Trainer",
    "meal":        "🥗 Sports Dietician",
    "motivate":    "🧠 Mindset Coach",
    "progress":    "📊 Performance Analyst",
    "reminder":    "⏰ Routine Manager",
    "medication":  "💊 Health Monitor",
    "recovery":    "🔄 Recovery Specialist",
    "celebration": "🏆 Performance Coach",
    "check_in":    "🤖 Central AI",
    "general":     "🤖 Central AI",
}

# Minimum word count below which we try the LLM fallback classifier
_SEMANTIC_FALLBACK_THRESHOLD = 4


def detect_intent(text: str) -> str:
    """
    Two-stage intent detection:
    1. Fast regex (< 1ms, zero cost) — handles explicit, keyword-rich messages.
    2. Synchronous LLM fallback for short/ambiguous messages (< 4 words, no regex hit).
       Returns a single intent word from the known set.
    """
    t = text.lower().strip()
    for intent, patterns in _INTENT_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, t):
                return intent

    # Short message with no regex match → ask the model to classify
    word_count = len(t.split())
    if word_count < _SEMANTIC_FALLBACK_THRESHOLD:
        return _classify_intent_llm(text)

    return "general"


def _classify_intent_llm(text: str) -> str:
    """
    Lightweight synchronous LLM call to classify short/ambiguous messages.
    Uses gpt-5-nano with a tight prompt — typically under 200ms.
    Falls back to 'general' on any error.
    """
    valid_intents = list(_INTENT_AGENT.keys())
    prompt = (
        f"Classify this fitness app message into exactly one of these intents: "
        f"{', '.join(valid_intents)}\n\n"
        f"Message: \"{text}\"\n\n"
        f"Reply with ONLY the intent word. No punctuation, no explanation."
    )
    try:
        from openai import OpenAI
        import os
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        resp = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=10,
        )
        result = resp.choices[0].message.content.strip().lower()
        return result if result in valid_intents else "general"
    except Exception as e:
        logger.debug(f"[Intent LLM fallback] {e}")
        return "general"


# ─────────────────────────────────────────────────────────────
# Secondary / inline injury detection
# ─────────────────────────────────────────────────────────────

# Patterns that indicate the user is mentioning an injury or body part limitation
# *in the same message* as a workout request (e.g. "make me a plan, I hurt my shoulder")
_INJURY_SIGNALS = [
    r"hurt\s+my", r"injured?\s+my", r"pain\s+in", r"pain\s+my",
    r"pulled\s+my", r"strain(ed)?\s+my", r"sprain(ed)?\s+my",
    r"tendon", r"torn", r"surgery", r"recovering from",
    r"bad\s+(knee|shoulder|back|hip|wrist|ankle|elbow|neck)",
    r"(knee|shoulder|back|hip|wrist|ankle|elbow|neck)\s+(pain|injury|issue|problem)",
    r"can'?t\s+(do|use|lift)", r"avoid.*exercise", r"skip.*exercise",
    r"don'?t\s+(train|work)\s+(my\s+)?(leg|arm|chest|shoulder|back)",
]


def _detect_inline_injury(text: str) -> str | None:
    """
    Return the user's raw message as injury context if it contains an inline injury mention
    alongside a workout request (so the trainer can adapt the plan immediately).
    Returns None if no injury signals found.
    """
    t = text.lower()
    for pat in _INJURY_SIGNALS:
        if re.search(pat, t):
            return text.strip()
    return None


# ─────────────────────────────────────────────────────────────
# Rich context builder
# ─────────────────────────────────────────────────────────────

def build_rich_context(db: Session, user: User) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    week_ago = now - timedelta(days=7)
    three_days_ago = now - timedelta(days=3)

    ctx = {
        "user_name": getattr(user, "full_name", None) or getattr(user, "name", "User"),
        # ── Agent-synthesised layers (highest signal) ─────────
        "daily_narratives": [],
        "morning_brief": None,
        "weekly_adaptation": None,
        "correlation_insights": [],
        "ai_recommendations": [],    # NEW — past AI suggestions (last 3)
        # ── User profile & body composition ───────────────────
        "health_profile": None,      # NEW — medical conditions
        "body_composition": None,    # NEW — TDEE, BF%, lean mass, calorie target
        "diet_targets": None,        # NEW — active diet plan targets
        "active_program": None,      # NEW — active workout program name & schedule
        # ── Raw data ──────────────────────────────────────────
        "recent_workouts": [],
        "recent_meals": [],
        "weight_history": [],
        "water_today": None,
        "health_memories": [],
        "disliked_items": {"exercises": [], "foods": []},
    }

    # ── Layer 1: Daily narratives ─────────────────────────────────────────────
    try:
        narratives = (
            db.query(HealthMemory)
            .filter(HealthMemory.user_id == user.id, HealthMemory.category == "daily_narrative")
            .order_by(HealthMemory.created_at.desc()).limit(7).all()
        )
        ctx["daily_narratives"] = [
            {"date": m.content.get("date", "?"), "summary": m.content.get("narrative", "")}
            for m in reversed(narratives) if m.content.get("narrative")
        ]
    except Exception as e:
        logger.debug(f"[Context] narratives: {e}")

    # ── Layer 2: Morning brief ────────────────────────────────────────────────
    try:
        brief = (
            db.query(HealthMemory)
            .filter(HealthMemory.user_id == user.id, HealthMemory.category == "morning_brief")
            .order_by(HealthMemory.created_at.desc()).first()
        )
        if brief and brief.content.get("brief"):
            ctx["morning_brief"] = {
                "date": brief.content.get("date"),
                "text": brief.content.get("brief"),
                "stats": brief.content.get("stats", {}),
            }
    except Exception as e:
        logger.debug(f"[Context] morning_brief: {e}")

    # ── Layer 4: Correlation insights ─────────────────────────────────────────
    try:
        corr = (
            db.query(HealthMemory)
            .filter(HealthMemory.user_id == user.id, HealthMemory.category == "correlation_insight")
            .order_by(HealthMemory.created_at.desc()).first()
        )
        if corr and corr.content.get("insights"):
            ctx["correlation_insights"] = [
                i.get("insight", "") for i in corr.content["insights"] if i.get("insight")
            ]
    except Exception as e:
        logger.debug(f"[Context] correlations: {e}")

    # ── Layer 5: Weekly adaptation ────────────────────────────────────────────
    try:
        adapt = (
            db.query(HealthMemory)
            .filter(HealthMemory.user_id == user.id, HealthMemory.category == "weekly_adaptation")
            .order_by(HealthMemory.created_at.desc()).first()
        )
        if adapt and adapt.content.get("report"):
            ctx["weekly_adaptation"] = {
                "date": adapt.content.get("date"),
                "report": adapt.content.get("report"),
                "adherence": adapt.content.get("adherence", {}),
            }
    except Exception as e:
        logger.debug(f"[Context] adaptation: {e}")

    # ── Past AI recommendations (last 3) ──────────────────────────────────────
    try:
        recs = (
            db.query(HealthMemory)
            .filter(HealthMemory.user_id == user.id, HealthMemory.category == "ai_recommendation")
            .order_by(HealthMemory.created_at.desc()).limit(3).all()
        )
        ctx["ai_recommendations"] = [
            {
                "date": m.content.get("date", "?"),
                "type": m.content.get("type", "plan"),
                "summary": m.content.get("summary", ""),
            }
            for m in reversed(recs)
        ]
    except Exception as e:
        logger.debug(f"[Context] ai_recommendations: {e}")

    # ── Health profile (conditions) ───────────────────────────────────────────
    try:
        from app.models.health_profile import HealthProfile
        hp = db.query(HealthProfile).filter(HealthProfile.user_id == user.id).first()
        if hp:
            conditions = []
            for field in ("diabetes", "hypertension", "thyroid", "pcos", "asthma"):
                if getattr(hp, field, False):
                    conditions.append(field)
            if hp.other_conditions:
                conditions.append(hp.other_conditions)
            ctx["health_profile"] = {
                "conditions": conditions,
                "doctor_notes": hp.doctor_notes or None,
            }
    except Exception as e:
        logger.debug(f"[Context] health_profile: {e}")

    # ── Body composition (TDEE, BF%, calorie target) ─────────────────────────
    try:
        # Get latest weight
        latest_w = (
            db.query(BodyWeightLog)
            .filter(BodyWeightLog.user_id == user.id)
            .order_by(BodyWeightLog.logged_at.desc()).first()
        )
        weight_kg = latest_w.weight_kg if latest_w else None

        # Pull workout prefs for activity level + goal
        w_prefs = get_preferences(db, user.id, "workout") or {}
        # Pull profile prefs for height/age/gender
        p_prefs = get_preferences(db, user.id, "profile") or {}

        if weight_kg:
            height_cm = _safe_float(p_prefs.get("height_cm"))
            age_raw = p_prefs.get("age")
            age = _parse_age(age_raw)
            gender = (p_prefs.get("gender") or "").lower() or None

            bc = compute_body_composition(
                weight_kg=weight_kg,
                height_cm=height_cm,
                age=age,
                gender=gender,
                activity_level=activity_level_from_prefs(w_prefs),
                goal=goal_from_prefs(w_prefs),
            )
            ctx["body_composition"] = {
                "weight_kg": weight_kg,
                "bmr": bc.bmr,
                "tdee": bc.tdee,
                "calorie_target": bc.calorie_target,
                "goal": bc.goal,
                "bf_pct_estimate": bc.bf_pct_estimate,
                "lean_mass_kg": bc.lean_mass_kg,
                "summary": bc.summary,
            }
    except Exception as e:
        logger.debug(f"[Context] body_composition: {e}")

    # ── Active diet plan targets ──────────────────────────────────────────────
    try:
        if hasattr(user, "active_diet_plan_id") and user.active_diet_plan_id:
            diet_plan = db.query(DietPlan).filter(DietPlan.id == user.active_diet_plan_id).first()
            if diet_plan:
                ctx["diet_targets"] = {
                    "calories": diet_plan.target_calories,
                    "protein_g": round(diet_plan.target_protein or 0),
                    "carbs_g": round(diet_plan.target_carbs or 0),
                    "fats_g": round(diet_plan.target_fats or 0),
                }
    except Exception as e:
        logger.debug(f"[Context] diet_targets: {e}")

    # ── Active workout program ────────────────────────────────────────────────
    try:
        if hasattr(user, "active_workout_program_id") and user.active_workout_program_id:
            from app.models.vault_item import VaultItem
            program = db.query(VaultItem).filter(
                VaultItem.id == user.active_workout_program_id,
                VaultItem.user_id == user.id,
            ).first()
            if program:
                content = program.content or {}
                days = content.get("days", [])
                day_names = [d.get("name", f"Day {i+1}") for i, d in enumerate(days)]
                ctx["active_program"] = {
                    "name": program.title or "Active Program",
                    "days": day_names,
                    "total_days": len(days),
                }
    except Exception as e:
        logger.debug(f"[Context] active_program: {e}")

    # ── Raw workout sessions ──────────────────────────────────────────────────
    try:
        sessions = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == user.id,
                WorkoutSession.status == SessionStatus.COMPLETED,
                WorkoutSession.completed_at >= week_ago,
            )
            .order_by(WorkoutSession.completed_at.desc()).limit(7).all()
        )
        for s in sessions:
            ctx["recent_workouts"].append({
                "date": s.completed_at.strftime("%b %d") if s.completed_at else "?",
                "duration_mins": s.duration_minutes or 0,
                "day_number": getattr(s, "day_number", None),
            })
    except Exception as e:
        logger.debug(f"[Context] workouts: {e}")

    # ── Raw meal logs ─────────────────────────────────────────────────────────
    try:
        meals = (
            db.query(MealLog)
            .filter(MealLog.user_id == user.id, MealLog.logged_at >= three_days_ago)
            .order_by(MealLog.logged_at.desc()).limit(12).all()
        )
        for m in meals:
            ctx["recent_meals"].append({
                "date": m.logged_at.strftime("%b %d") if m.logged_at else "?",
                "meal_name": m.meal_name or "Meal",
                "calories": round(m.total_calories or 0),
                "protein_g": round(m.total_protein or 0),
                "carbs_g": round(m.total_carbs or 0),
                "fats_g": round(m.total_fats or 0),
            })
    except Exception as e:
        logger.debug(f"[Context] meals: {e}")

    # ── Weight history ────────────────────────────────────────────────────────
    try:
        weights = (
            db.query(BodyWeightLog)
            .filter(BodyWeightLog.user_id == user.id)
            .order_by(BodyWeightLog.logged_at.desc()).limit(14).all()
        )
        ctx["weight_history"] = [
            {"date": w.logged_at.strftime("%b %d"), "kg": w.weight_kg}
            for w in reversed(weights)
        ]
    except Exception as e:
        logger.debug(f"[Context] weight: {e}")

    # ── Water ─────────────────────────────────────────────────────────────────
    try:
        water = db.query(WaterLog).filter(
            WaterLog.user_id == user.id, WaterLog.date == today
        ).first()
        if water:
            ctx["water_today"] = {"glasses": water.glasses, "target": water.target_glasses}
    except Exception as e:
        logger.debug(f"[Context] water: {e}")

    # ── Raw health memories (exclude agent-generated categories) ─────────────
    try:
        _exclude = {
            "disliked_item", "daily_narrative", "morning_brief",
            "weekly_adaptation", "correlation_insight", "nudge_sent",
            "notification", "ai_recommendation",
        }
        memories = (
            db.query(HealthMemory)
            .filter(
                HealthMemory.user_id == user.id,
                HealthMemory.category.notin_(_exclude),
            )
            .order_by(HealthMemory.created_at.desc()).limit(20).all()
        )
        ctx["health_memories"] = [
            {"category": m.category, "content": m.content}
            for m in memories
        ]
    except Exception as e:
        logger.debug(f"[Context] memories: {e}")

    # ── Disliked items ────────────────────────────────────────────────────────
    try:
        ctx["disliked_items"] = get_disliked_items(db, user.id)
    except Exception as e:
        logger.debug(f"[Context] disliked: {e}")

    return ctx


# ── Helpers for safe type conversion ─────────────────────────────────────────

def _safe_float(val) -> float | None:
    try:
        return float(val) if val not in (None, "", "none") else None
    except (ValueError, TypeError):
        return None


def _parse_age(val) -> int | None:
    """Parse age from either an exact int string or a range like '20–29'."""
    if val is None:
        return None
    try:
        return int(str(val).strip())
    except ValueError:
        pass
    # Range like "20–29" or "20-29"
    import re
    m = re.match(r"(\d+)", str(val).strip())
    if m:
        return int(m.group(1)) + 5  # midpoint approximation
    return None


def format_context_for_prompt(ctx: dict) -> str:
    lines = [f"USER: {ctx['user_name']}", ""]

    # ── Body composition + calorie targets (always first — grounds everything) ─
    bc = ctx.get("body_composition")
    if bc:
        lines.append("BODY COMPOSITION & CALORIE TARGETS:")
        lines.append(f"  {bc['summary']}")
        if ctx.get("diet_targets"):
            dt = ctx["diet_targets"]
            lines.append(
                f"  Active diet plan targets: {dt['calories']} kcal | "
                f"P:{dt['protein_g']}g C:{dt['carbs_g']}g F:{dt['fats_g']}g"
            )
        lines.append("")

    # ── Health conditions (critical — affects every recommendation) ───────────
    hp = ctx.get("health_profile")
    if hp and hp.get("conditions"):
        cond_str = ", ".join(hp["conditions"])
        lines.append(f"⚠️ HEALTH CONDITIONS (always account for these): {cond_str}")
        if hp.get("doctor_notes"):
            lines.append(f"  Doctor notes: {hp['doctor_notes'][:200]}")
        lines.append("")

    # ── Active workout program ────────────────────────────────────────────────
    prog = ctx.get("active_program")
    if prog:
        day_str = " | ".join(prog["days"]) if prog["days"] else "No days defined"
        lines.append(f"ACTIVE WORKOUT PROGRAM: {prog['name']} ({prog['total_days']}-day program)")
        lines.append(f"  Days: {day_str}")
        lines.append("")

    # ── Past AI recommendations ───────────────────────────────────────────────
    if ctx.get("ai_recommendations"):
        lines.append("WHAT I PREVIOUSLY RECOMMENDED (close the loop — reference these):")
        for r in ctx["ai_recommendations"]:
            lines.append(f"  [{r['date']}] {r['type'].upper()}: {r['summary']}")
        lines.append("")

    # ── Priority 1: Daily narratives (Layer 1) ─────────────────────────────
    if ctx.get("daily_narratives"):
        lines.append("RECENT DAILY SUMMARIES (synthesised by AI, last 7 days — highest signal):")
        for n in ctx["daily_narratives"]:
            lines.append(f"  [{n['date']}] {n['summary']}")
        lines.append("")

    # ── Priority 2: Morning brief (Layer 2) ───────────────────────────────
    if ctx.get("morning_brief"):
        b = ctx["morning_brief"]
        lines.append(f"TODAY'S MORNING BRIEF ({b.get('date', 'today')}):")
        brief_text = b.get("text", "").replace("## ", "").replace("# ", "")
        lines.append(f"  {brief_text[:400]}")
        st = b.get("stats", {})
        if st.get("streak_days"):
            lines.append(f"  Streak: {st['streak_days']} days | Sessions this week: {st.get('sessions_this_week', 0)}")
        lines.append("")

    # ── Priority 3: Correlation insights (Layer 4) ────────────────────────
    if ctx.get("correlation_insights"):
        lines.append("DATA-DRIVEN INSIGHTS (from 30-day correlation analysis):")
        for insight in ctx["correlation_insights"][:3]:
            lines.append(f"  • {insight}")
        lines.append("")

    # ── Priority 4: Weekly adaptation (Layer 5) ───────────────────────────
    if ctx.get("weekly_adaptation"):
        a = ctx["weekly_adaptation"]
        lines.append(f"LATEST WEEKLY ADAPTATION REPORT ({a.get('date', '?')}):")
        report_text = a.get("report", "").replace("## ", "").replace("# ", "")
        lines.append(f"  {report_text[:300]}")
        adh = a.get("adherence", {})
        if adh:
            lines.append(f"  Workout adherence: {adh.get('workout_adherence_pct', '?')}% | Meal adherence: {adh.get('meal_adherence_pct', '?')}%")
        lines.append("")

    # ── Raw workouts ──────────────────────────────────────────────────────
    if ctx["recent_workouts"]:
        lines.append("RECENT WORKOUTS (last 7 days):")
        for w in ctx["recent_workouts"]:
            day_hint = f" (Day {w['day_number']})" if w.get("day_number") else ""
            lines.append(f"  • {w['date']}{day_hint} — {w['duration_mins']} mins")
    else:
        lines.append("RECENT WORKOUTS: None logged yet.")
    lines.append("")

    # ── Raw meals with calorie gap ────────────────────────────────────────
    if ctx["recent_meals"]:
        lines.append("RECENT NUTRITION (last 3 days):")
        for m in ctx["recent_meals"][:6]:
            lines.append(
                f"  • {m['date']} {m['meal_name']}: {m['calories']} kcal "
                f"| P:{m['protein_g']}g C:{m['carbs_g']}g F:{m['fats_g']}g"
            )
        # Show calorie gap vs target
        if bc and ctx["recent_meals"]:
            today_str = ctx["recent_meals"][0]["date"]
            today_cals = sum(
                m["calories"] for m in ctx["recent_meals"] if m["date"] == today_str
            )
            gap = bc["calorie_target"] - today_cals
            if gap > 0:
                lines.append(f"  Today: {today_cals} kcal logged — {gap} kcal below target")
            elif gap < 0:
                lines.append(f"  Today: {today_cals} kcal logged — {abs(gap)} kcal over target")
    else:
        lines.append("RECENT NUTRITION: No meals logged yet.")
    lines.append("")

    # ── Weight ────────────────────────────────────────────────────────────
    if ctx["weight_history"]:
        latest = ctx["weight_history"][-1]
        lines.append(f"CURRENT WEIGHT: {latest['kg']} kg (as of {latest['date']})")
        if len(ctx["weight_history"]) >= 2:
            oldest = ctx["weight_history"][0]
            delta = round(latest["kg"] - oldest["kg"], 1)
            direction = "↑" if delta > 0 else ("↓" if delta < 0 else "→")
            lines.append(f"  Trend: {direction} {abs(delta)} kg over {len(ctx['weight_history'])} entries")
            # Contextualise vs goal
            if bc:
                if bc["goal"] == "cut" and delta > 0:
                    lines.append("  ⚠️ Weight trending up but goal is cut — worth reviewing nutrition")
                elif bc["goal"] == "bulk" and delta < 0:
                    lines.append("  ⚠️ Weight trending down but goal is bulk — may need more calories")
        lines.append("")

    # ── Water ─────────────────────────────────────────────────────────────
    if ctx["water_today"]:
        w = ctx["water_today"]
        lines.append(f"TODAY'S WATER: {w['glasses']}/{w['target']} glasses")
        lines.append("")

    # ── Supplementary raw memories ────────────────────────────────────────
    if ctx["health_memories"]:
        lines.append("OTHER HEALTH EVENTS (recent):")
        for m in ctx["health_memories"][:8]:
            cat = m["category"]
            content = m["content"]
            if isinstance(content, dict):
                event = content.get("event", cat)
                ts = content.get("timestamp", "")[:10]
                lines.append(f"  [{ts}] {event}: {json.dumps(content)[:100]}")
            else:
                lines.append(f"  [{cat}]: {str(content)[:80]}")
        lines.append("")

    # ── Dislikes ──────────────────────────────────────────────────────────
    dis = ctx["disliked_items"]
    if dis["exercises"]:
        lines.append(f"DISLIKED EXERCISES (NEVER include): {', '.join(dis['exercises'])}")
    if dis["foods"]:
        lines.append(f"DISLIKED FOODS (NEVER include): {', '.join(dis['foods'])}")
    if dis["exercises"] or dis["foods"]:
        lines.append("")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# Per-intent system prompts
# ─────────────────────────────────────────────────────────────

_BASE_PERSONA = (
    "You are Central — an elite, highly personalised AI fitness companion built into FitConnect. "
    "You orchestrate a team of specialist agents: a Personal Trainer, Sports Dietician, Mindset Coach, "
    "Performance Analyst, and Health Monitor. You always respond as the right specialist for the question. "
    "You are warm, specific, and direct. You NEVER give generic advice — everything is grounded in the "
    "user's actual data above. "
    "Use markdown: **bold** for key numbers, tables for plans, ## headers for sections. "
    "Be concise but complete. The user should feel they have a world-class coaching team in their pocket."
)


def _agent_header(intent: str) -> str:
    """Return a subtle agent handoff line to prepend to system prompts."""
    agent = _INTENT_AGENT.get(intent, _INTENT_AGENT["general"])
    return f"ACTIVE AGENT: {agent}\nYou are responding as this specialist. Stay in character.\n\n"


def _system_workout(prefs: dict, ctx_text: str, disliked: dict, injury_note: str | None = None) -> str:
    days = prefs.get("days_per_week", "4 days").replace(" days", "").replace(" day", "")
    excl = (
        f"\n⚠️ NEVER include these exercises (user has disliked them): {', '.join(disliked['exercises'])}"
        if disliked["exercises"] else ""
    )
    # Inline injury override — mentioned in THIS message, takes priority over saved prefs
    inline_injury = (
        f"\n\n🚨 INLINE INJURY ALERT (mentioned in this exact message — ADAPT THE ENTIRE PLAN AROUND THIS):\n"
        f'"{injury_note}"\n'
        f"→ Remove ALL exercises that stress the injured area. Offer safe alternatives. "
        f"Acknowledge the limitation explicitly at the top of the response."
    ) if injury_note else ""

    return f"""{_agent_header("workout")}{_BASE_PERSONA}

{ctx_text}

USER WORKOUT PREFERENCES:
• Days/week: {prefs.get('days_per_week','4 days')} | Location: {prefs.get('location','Gym')}
• Goal: {prefs.get('goal','Build muscle')} | Level: {prefs.get('experience','Intermediate')}
• Injuries/Avoid: {prefs.get('injuries','None')}{excl}{inline_injury}

TASK: Generate a complete {days}-day program. FORMAT RULES:
1. Program name + 1-line description.
2. Each day: ## Day N — Focus (Muscle Groups)
3. Under each day: markdown table with columns: | Exercise | Sets | Reps | Rest | Technique Note |
4. After table: 1-2 line coaching note + recommended session duration.
5. End with ## Weekly Structure table: | Day | Focus | Volume | Duration |
6. Reference user's real data where available (weight trend, recent session durations).
7. Include progressive overload guidance for intermediate/advanced.
8. Exact timings: how long each session should take."""


def _system_meal(prefs: dict, ctx_text: str, disliked: dict, workout_schedule: str) -> str:
    excl = (
        f"\n⚠️ NEVER include these foods (user has disliked them): {', '.join(disliked['foods'])}"
        if disliked["foods"] else ""
    )
    return f"""{_agent_header("meal")}{_BASE_PERSONA}

{ctx_text}

USER MEAL PREFERENCES:
• Diet: {prefs.get('diet_type','Non-vegetarian')} | Cuisine: {prefs.get('cuisine','Mixed')}
• Cook time: {prefs.get('cook_time','Moderate')} | Allergies: {prefs.get('allergies','None')}
• Schedule: {prefs.get('schedule','3 meals, wake 7–9am')}{excl}

WORKOUT SCHEDULE (for meal timing):
{workout_schedule or "No scheduled workouts found."}

TASK: Generate a complete 7-day meal plan. FORMAT RULES:
1. Daily calorie & macro targets: **Calories | Protein | Carbs | Fats**
2. Each day: ## Day N (Weekday)
3. Under each day: | Time | Meal | Foods & Qty | Calories | P | C | F |
4. After table: 1-line note explaining timing rationale for that day.
5. ## Weekly Summary table: avg daily macros.
6. TIMING CRITICAL: pre-workout meal 90min before, post-workout 45–60min after, no heavy meal within 60min of training.
7. Include WHY each meal is structured as it is (digestion, energy, recovery).
8. Reference user's weight and goal from health data."""


def _system_motivate(ctx_text: str, memory_count: int) -> str:
    if memory_count < 10:
        mode = (
            "This is an early user with less than 2 weeks of data. "
            "Give high-quality, warm, genuine motivational coaching. "
            "Ask what they're working towards and give a specific, personal response. No clichés."
        )
    else:
        mode = (
            "This user has real data. Analyse their patterns from the health memories. "
            "Identify specifically WHERE they're doing well (name the actual thing, date, number) "
            "and ONE area losing momentum. Reference real dates and numbers. "
            "End with ONE specific actionable thing they can do TODAY. Keep it under 200 words."
        )
    return f"""{_agent_header("motivate")}{_BASE_PERSONA}

{ctx_text}

MODE: {mode}

RULES: No generic advice. No 'stay consistent' or 'believe in yourself'. Reference real data."""


def _system_progress(ctx_text: str) -> str:
    return f"""{_agent_header("progress")}{_BASE_PERSONA}

{ctx_text}

TASK: Structured progress report. FORMAT:

## 📊 Progress Report

### 🏋️ Workout Summary
(sessions completed, adherence %, duration trends)

### 🥗 Nutrition Summary
(avg daily calories, protein consistency, best/worst days)

### ⚖️ Body Composition
(weight trend, delta, direction)

### 🏆 Highlights
(specific wins — name the exercises, foods, numbers)

### 🎯 Focus Areas
(1–2 specific improvements, not generic)

### 💬 Coach's Note
(personal, warm, 2–3 sentences referencing their actual journey)

If data is sparse, acknowledge warmly and motivate them to build the habit."""


def _system_reminder(answers: dict) -> str:
    category = answers.get("category", answers.get("reminder_type", "general"))
    time_val = answers.get("time", "?")
    frequency = answers.get("frequency", "?")
    details = answers.get("custom_text") or answers.get("title") or ""

    category_context = {
        "workout": "This is a workout reminder. Tie it to their training goals.",
        "meal": "This is a meal/nutrition reminder. Mention the importance of eating on schedule.",
        "medication": "This is a MEDICATION reminder. Be especially warm and supportive. Emphasise consistency.",
        "checkup": "This is a health checkup reminder. Encourage them to attend and prepare their health records.",
        "other": "This is a custom reminder the user set for themselves.",
    }.get(category.lower(), "")

    return f"""{_BASE_PERSONA}

A reminder has been set:
• Category: {category}
• Time: {time_val}
• Frequency: {frequency}
• Details: {details or "N/A"}

{category_context}

Respond with a warm, personal confirmation: "Done! I'll remind you to [specific thing] at [time], [frequency]."
Add ONE encouraging sentence. Keep it under 3 sentences total. Sound like a coach who genuinely cares."""


def _system_medication_status(ctx_text: str, medication_ctx: str) -> str:
    return f"""{_BASE_PERSONA}

{ctx_text}

{medication_ctx}

The user is asking about their medication. Answer directly from the medication context above.
If data is available: tell them exactly which tablets are taken/missed today.
If no data: tell them you can see their medication schedule and guide them to the Today tab.
Be warm, clear, and supportive. 2-4 sentences."""


def _system_general(ctx_text: str) -> str:
    return f"""{_agent_header("general")}{_BASE_PERSONA}

{ctx_text}

Answer directly using the user's actual data where relevant. Use markdown where it helps clarity."""


# ─────────────────────────────────────────────────────────────
# Reminder creation helper
# ─────────────────────────────────────────────────────────────

async def _create_reminder_from_answers(db: Session, user: User, answers: dict):
    """Create a Reminder from a Central AI conversation flow."""
    try:
        from app.models.reminder import Reminder
        from datetime import datetime as dt, date

        # Parse time (supports both "07:30" and "Morning (7am)" style)
        time_map = {
            "morning (7am)": "07:00", "morning": "07:00",
            "midday (12pm)": "12:00", "noon": "12:00",
            "afternoon (4pm)": "16:00", "afternoon": "16:00",
            "evening (7pm)": "19:00", "evening": "19:00",
            "night (9pm)": "21:00", "night": "21:00",
        }
        raw_time = answers.get("time", "07:00").lower().strip()
        parsed_time = time_map.get(raw_time, raw_time if ":" in raw_time else "07:00")
        try:
            hour, minute = map(int, parsed_time.split(":"))
        except Exception:
            hour, minute = 7, 0

        # Build a real datetime (today or tomorrow if time has passed)
        now = dt.utcnow()
        scheduled = dt(now.year, now.month, now.day, hour, minute)
        if scheduled <= now:
            from datetime import timedelta
            scheduled += timedelta(days=1)

        # Recurrence
        freq_raw = answers.get("frequency", "every day").lower()
        if "weekday" in freq_raw:
            recurrence = "specific"
            recurrence_days = '["mon","tue","wed","thu","fri"]'
        elif "specific" in freq_raw:
            recurrence = "specific"
            recurrence_days = None
        elif "once" in freq_raw or "one time" in freq_raw:
            recurrence = "once"
            recurrence_days = None
        elif "weekly" in freq_raw:
            recurrence = "weekly"
            recurrence_days = None
        else:
            recurrence = "daily"
            recurrence_days = None

        # Category mapping
        category_raw = answers.get("category", answers.get("reminder_type", "other")).lower()
        category_map = {
            "workout": "workout", "exercise": "workout", "gym": "workout", "training": "workout",
            "meal": "meal", "food": "meal", "nutrition": "meal", "eat": "meal", "supplement": "meal",
            "medication": "medication", "medicine": "medication", "tablet": "medication", "pill": "medication",
            "checkup": "checkup", "doctor": "checkup", "appointment": "checkup", "test": "checkup",
        }
        cat = "other"
        for key, val in category_map.items():
            if key in category_raw:
                cat = val
                break

        title = answers.get("custom_text") or answers.get("title") or f"{cat.capitalize()} reminder"

        reminder = Reminder(
            user_id      = user.id,
            title        = title,
            type         = cat,
            message      = title,
            scheduled_at = scheduled,
            recurrence   = recurrence,
            recurrence_days = recurrence_days,
            is_active    = True,
        )
        db.add(reminder)
        db.commit()
        logger.info(f"[ai_central] Reminder created: {title} @ {scheduled.strftime('%H:%M')} ({recurrence})")
        return reminder
    except Exception as e:
        logger.warning(f"[ai_central] Reminder creation failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# Recommendation memory writer (B-5)
# ─────────────────────────────────────────────────────────────

def _write_recommendation_memory(
    db: Session,
    user_id: int,
    intent: str,
    prefs: dict,
    ctx: dict,
) -> None:
    """
    Write a HealthMemory(category='ai_recommendation') entry capturing what
    the AI just recommended.  Called before streaming when a full plan-generation
    flow fires (i.e. flow_context.answers is non-empty).

    Future context reads these entries under "WHAT I PREVIOUSLY RECOMMENDED"
    so the AI can follow up on its own advice.
    """
    try:
        now = datetime.now(timezone.utc)

        if intent == "workout":
            days = prefs.get("days_per_week", "?")
            goal = prefs.get("goal", "?")
            level = prefs.get("experience", "?")
            loc = prefs.get("location", "Gym")
            summary = f"{days} workout program | Goal: {goal} | Level: {level} | Location: {loc}"

        elif intent == "meal":
            bc = ctx.get("body_composition") or {}
            target = bc.get("calorie_target") or prefs.get("calorie_target", "?")
            diet = prefs.get("diet_type", "?")
            cuisine = prefs.get("cuisine", "Mixed")
            summary = f"7-day meal plan | Diet: {diet} | Cuisine: {cuisine} | Target: {target} kcal"

        else:
            return   # only record workout & meal plan generations

        db.add(HealthMemory(
            user_id=user_id,
            category="ai_recommendation",
            source="ai",
            content={
                "date": now.strftime("%Y-%m-%d"),
                "type": intent,
                "summary": summary,
            },
        ))
        db.commit()
        logger.info(f"[ai_central] Rec memory: {intent} → {summary[:80]}")
    except Exception as e:
        logger.debug(f"[ai_central] rec_memory write failed: {e}")
        try:
            db.rollback()
        except Exception:
            pass


# ─────────────────────────────────────────────────────────────
# Core streaming generator
# ─────────────────────────────────────────────────────────────

async def _stream_openai(messages: list, intent: str = "general") -> AsyncGenerator[str, None]:
    client = _get_openai()
    agent_label = _INTENT_AGENT.get(intent, _INTENT_AGENT["general"])
    try:
        # Send agent metadata first so the frontend can show who's responding
        yield f"data: {json.dumps({'agent': agent_label, 'intent': intent})}\n\n"

        stream = await client.chat.completions.create(
            model="gpt-5-nano",
            messages=messages,
            stream=True,
            max_completion_tokens=16000,  # reasoning model — needs headroom for thinking + output
            timeout=120.0,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield f"data: {json.dumps({'token': delta.content})}\n\n"

        yield f"data: {json.dumps({'done': True, 'intent': intent})}\n\n"
    except Exception as e:
        logger.error(f"[ai_central] Stream error: {e}")
        yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"


def _build_messages(system_prompt: str, conv_history: list, question: str) -> list:
    messages = [{"role": "system", "content": system_prompt}]
    for msg in conv_history[-10:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})
    return messages


# ─────────────────────────────────────────────────────────────
# POST /ai/central/stream  — Primary streaming endpoint
# ─────────────────────────────────────────────────────────────

@router.post("/stream")
async def stream_central(
    body: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = body.question.strip()
    conv_history = body.conversation_history or []
    flow_ctx = body.flow_context or {}

    ctx = build_rich_context(db, current_user)
    ctx_text = format_context_for_prompt(ctx)
    disliked = ctx["disliked_items"]

    intent = flow_ctx.get("intent") or detect_intent(question)
    prefs: dict = {}   # populated below for workout/meal; used by rec-memory writer

    if intent == "workout":
        prefs = get_preferences(db, current_user.id, "workout") or {}
        # Detect inline injury mentions in THIS message (overrides saved prefs)
        inline_injury = _detect_inline_injury(question)
        system_prompt = _system_workout(prefs, ctx_text, disliked, injury_note=inline_injury)

    elif intent == "meal":
        prefs = get_preferences(db, current_user.id, "meal") or {}
        ws_str = "\n".join(
            f"  • {w['date']} — {w['duration_mins']} min"
            for w in ctx["recent_workouts"]
        )
        system_prompt = _system_meal(prefs, ctx_text, disliked, ws_str)

    elif intent == "motivate":
        system_prompt = _system_motivate(ctx_text, len(ctx["health_memories"]))

    elif intent == "progress":
        system_prompt = _system_progress(ctx_text)

    elif intent == "reminder":
        answers = flow_ctx.get("answers", {})
        system_prompt = _system_reminder(answers)
        if answers.get("frequency"):
            await _create_reminder_from_answers(db, current_user, answers)

    elif intent == "medication":
        # Pull today's medication logs for context
        medication_ctx = ""
        try:
            from app.models.medication_schedule import MedicationSchedule, MedicationLog
            from datetime import date
            import json as _json
            today = date.today().isoformat()
            schedules = db.query(MedicationSchedule).filter(
                MedicationSchedule.user_id == current_user.id,
                MedicationSchedule.is_active == True,
            ).all()
            if schedules:
                lines = ["## Today's Medication Schedule"]
                for s in schedules:
                    log = db.query(MedicationLog).filter(
                        MedicationLog.schedule_id == s.id,
                        MedicationLog.log_date == today,
                    ).first()
                    tablets = _json.loads(s.tablets or "[]")
                    status = _json.loads(log.tablets_status if log else "{}") if log else {}
                    lines.append(f"\n**{s.name}** ({s.scheduled_time})")
                    for t in tablets:
                        taken = status.get(t.get("name", ""), False)
                        icon = "✅" if taken else "❌"
                        lines.append(f"  {icon} {t.get('name')} {t.get('dosage','')}")
                medication_ctx = "\n".join(lines)
            else:
                medication_ctx = "No medication schedules set up yet."
        except Exception as _e:
            medication_ctx = ""
            logger.debug(f"[medication ctx] {_e}")

        system_prompt = _system_medication_status(ctx_text, medication_ctx)

    else:
        system_prompt = _system_general(ctx_text)

    messages = _build_messages(system_prompt, conv_history, question)

    # ── Recommendation memory write (B-5) ─────────────────────────────────────
    # When a workout or meal plan is being generated (answers collected = flow complete),
    # record what we're about to recommend so future context includes it.
    if intent in ("workout", "meal") and flow_ctx.get("answers"):
        _write_recommendation_memory(db, current_user.id, intent, prefs, ctx)

    # Log agent usage to health memory (fire-and-forget, non-blocking)
    try:
        db.add(HealthMemory(
            user_id=current_user.id, category="ai_insight", source="ai",
            content={"question": question[:200], "intent": intent,
                     "agent": _INTENT_AGENT.get(intent, "Central AI")},
        ))
        db.commit()
    except Exception:
        pass

    return StreamingResponse(
        _stream_openai(messages, intent=intent),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


# ─────────────────────────────────────────────────────────────
# POST /ai/central/ask  — Non-streaming legacy
# ─────────────────────────────────────────────────────────────

@router.post("/ask")
async def ask_central(
    body: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = body.question.strip()
    conv_history = body.conversation_history or []
    flow_ctx = body.flow_context or {}

    ctx = build_rich_context(db, current_user)
    ctx_text = format_context_for_prompt(ctx)
    disliked = ctx["disliked_items"]
    intent = flow_ctx.get("intent") or detect_intent(question)

    if intent == "workout":
        inline_injury = _detect_inline_injury(question)
        system_prompt = _system_workout(get_preferences(db, current_user.id, "workout") or {}, ctx_text, disliked, injury_note=inline_injury)
    elif intent == "meal":
        system_prompt = _system_meal(get_preferences(db, current_user.id, "meal") or {}, ctx_text, disliked, "")
    elif intent == "motivate":
        system_prompt = _system_motivate(ctx_text, len(ctx["health_memories"]))
    elif intent == "progress":
        system_prompt = _system_progress(ctx_text)
    elif intent == "reminder":
        system_prompt = _system_reminder(flow_ctx.get("answers", {}))
    else:
        system_prompt = _system_general(ctx_text)

    messages = _build_messages(system_prompt, conv_history, question)

    try:
        client = _get_openai()
        resp = await client.chat.completions.create(
            model="gpt-5-nano", messages=messages, max_completion_tokens=16000,
            timeout=120.0,
        )
        answer = resp.choices[0].message.content
        try:
            db.add(HealthMemory(
                user_id=current_user.id, category="ai_insight", source="ai",
                content={"question": question, "answer": answer[:400], "intent": intent},
            ))
            db.commit()
        except Exception:
            pass
        return {"answer": answer, "intent": intent}
    except Exception as e:
        logger.error(f"[ai_central/ask] {e}")
        return {"answer": "I'm having trouble right now. Please try again.", "intent": intent}


# ─────────────────────────────────────────────────────────────
# Preferences
# ─────────────────────────────────────────────────────────────

@router.get("/preferences/{pref_type}")
async def get_prefs(pref_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = get_preferences(db, current_user.id, pref_type)
    return {"preference_type": pref_type, "data": data, "locked": data is not None}


@router.post("/preferences")
async def save_prefs(body: PreferenceSaveRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = save_preferences(db, current_user.id, body.preference_type, body.data)
    return {"preference_type": row.preference_type, "data": row.data, "locked": True}


@router.delete("/preferences/{pref_type}")
async def clear_prefs(pref_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ok = clear_preferences(db, current_user.id, pref_type)
    return {"cleared": ok, "preference_type": pref_type}


# ─────────────────────────────────────────────────────────────
# Dislike
# ─────────────────────────────────────────────────────────────

@router.post("/dislike")
async def log_dislike(body: DislikeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    write_disliked_item(db=db, user_id=current_user.id, item_type=body.item_type, item_name=body.item_name, context=body.context)
    return {"logged": True, "item_type": body.item_type, "item_name": body.item_name}


# ─────────────────────────────────────────────────────────────
# Questions
# ─────────────────────────────────────────────────────────────

@router.get("/questions/{flow_type}")
async def get_flow_questions(flow_type: str):
    return {"flow_type": flow_type, "questions": get_questions(flow_type)}
