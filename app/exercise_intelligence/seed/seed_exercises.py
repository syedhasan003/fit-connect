from sqlalchemy.orm import Session
from app.exercise_intelligence.models.exercise import Exercise
from app.exercise_intelligence.seed.base_exercises import BASE_EXERCISES
from app.exercise_intelligence.seed.variations import VARIATIONS


def seed_exercises(db: Session):
    existing = {e.name for e in db.query(Exercise).all()}

    base_map = {}

    for data in BASE_EXERCISES:
        if data["name"] in existing:
            continue

        exercise = Exercise(**data)
        db.add(exercise)
        db.flush()
        base_map[data["name"]] = exercise

    for base_name, variants in VARIATIONS.items():
        base = base_map.get(base_name)
        if not base:
            continue

        for v in variants:
            if v["name"] in existing:
                continue

            variant = Exercise(
                name=v["name"],
                category=base.category,
                movement_pattern=base.movement_pattern,
                primary_muscles=base.primary_muscles,
                secondary_muscles=base.secondary_muscles,
                equipment=v.get("equipment", base.equipment),
                difficulty_level=v.get("difficulty_level", base.difficulty_level),
                skill_requirement=v.get("skill_requirement", base.skill_requirement),
                stimulus=base.stimulus,
                fatigue_profile=v.get("fatigue_profile", base.fatigue_profile),
                joint_stress=base.joint_stress,
                risk_flags=base.risk_flags,
                tags=v.get("tags", base.tags),
                is_variation=True,
                base_exercise_id=base.id,
            )
            db.add(variant)

    db.commit()
