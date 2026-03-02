"""
memory_writer.py
Shared service for writing structured health memories after key user actions.
Called fire-and-forget style — errors are swallowed so they never break the main flow.
"""

from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session

from app.models.health_memory import HealthMemory

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Core writer
# ─────────────────────────────────────────────────────────────

def _write(db: Session, user_id: int, category: str, source: str, content: dict):
    """
    Creates a HealthMemory row and optionally mirrors to Vault.
    Never raises — all errors are logged and swallowed.
    """
    try:
        memory = HealthMemory(
            user_id=user_id,
            category=category,
            source=source,
            content=content,
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)

        # Mirror to Vault (best-effort)
        try:
            from app.services.vault_mirror import VaultMirrorService
            from app.models.user import User
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                VaultMirrorService().mirror_memory(db=db, user=user, memory=memory)
        except Exception as mirror_err:
            logger.debug(f"[MemoryWriter] Vault mirror skipped: {mirror_err}")

        return memory

    except Exception as e:
        logger.warning(f"[MemoryWriter] Failed to write memory (category={category}): {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return None


# ─────────────────────────────────────────────────────────────
# Workout
# ─────────────────────────────────────────────────────────────

def write_workout_memory(
    db: Session,
    user_id: int,
    program_name: str,
    day_number: int,
    day_name: str,
    exercises: list,        # [{name, sets_done, total_volume_kg, top_weight_kg}]
    total_volume_kg: float,
    duration_mins: int,
    pr_list: list,          # [{exercise, weight_kg}]
    energy_level: str = None,
    soreness_level: str = None,
):
    """Called after PATCH /api/workouts/sessions/{id}/complete."""
    content = {
        "event": "workout_completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "program_name": program_name,
        "day_number": day_number,
        "day_name": day_name,
        "exercises": exercises,
        "total_volume_kg": total_volume_kg,
        "duration_mins": duration_mins,
        "pr_list": pr_list,
        "energy_level": energy_level,
        "soreness_level": soreness_level,
    }
    return _write(db, user_id, "workout", "system", content)


# ─────────────────────────────────────────────────────────────
# Meal
# ─────────────────────────────────────────────────────────────

def write_meal_memory(
    db: Session,
    user_id: int,
    meal_time: str,
    calories: float,
    protein_g: float,
    carbs_g: float,
    fats_g: float,
    foods: list,            # [str] food names
    diet_plan_name: str = None,
    planned_time: str = None,
):
    """Called after POST /api/diet/logs."""
    content = {
        "event": "meal_logged",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "meal_time": meal_time,
        "calories": round(calories, 1),
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fats_g": round(fats_g, 1),
        "foods": foods,
        "diet_plan_name": diet_plan_name,
        "planned_time": planned_time,
    }
    return _write(db, user_id, "nutrition", "system", content)


# ─────────────────────────────────────────────────────────────
# Body weight
# ─────────────────────────────────────────────────────────────

def write_weight_memory(
    db: Session,
    user_id: int,
    weight_kg: float,
    trend: str,     # 'up' | 'down' | 'stable'
    note: str = None,
):
    """Called after POST /api/metrics/weight."""
    content = {
        "event": "weight_logged",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "weight_kg": weight_kg,
        "trend": trend,
        "note": note,
    }
    return _write(db, user_id, "body_metrics", "system", content)


# ─────────────────────────────────────────────────────────────
# Disliked items (granular — per exercise / per food)
# ─────────────────────────────────────────────────────────────

def write_disliked_item(
    db: Session,
    user_id: int,
    item_type: str,     # 'exercise' | 'food' | 'ingredient'
    item_name: str,
    context: str = None,
):
    """
    Called when a user taps 👎 on a specific exercise row or food item.
    item_type: 'exercise' | 'food' | 'ingredient'
    context: optional extra info e.g. the program name or meal where it appeared
    """
    content = {
        "event": "item_disliked",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "item_type": item_type,
        "item_name": item_name,
        "context": context,
    }
    return _write(db, user_id, "disliked_item", "user", content)


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def get_disliked_items(db: Session, user_id: int) -> dict:
    """
    Returns {exercises: [str], foods: [str]} of all items the user has disliked.
    Used by ai_central to inject exclusions into system prompts.
    """
    memories = (
        db.query(HealthMemory)
        .filter(
            HealthMemory.user_id == user_id,
            HealthMemory.category == "disliked_item",
        )
        .all()
    )

    exercises = []
    foods = []

    for m in memories:
        content = m.content or {}
        name = content.get("item_name", "")
        item_type = content.get("item_type", "")
        if not name:
            continue
        if item_type == "exercise":
            exercises.append(name)
        elif item_type in ("food", "ingredient"):
            foods.append(name)

    return {
        "exercises": list(set(exercises)),
        "foods": list(set(foods)),
    }
