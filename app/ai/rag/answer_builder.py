from typing import List, Dict, Set

SAFE_TOPICS: Set[str] = {
    "nutrition",
    "workouts",
    "recovery",
    "exercise safety",
    "fitness"
}


def build_answer(query: str, chunks: List[Dict]) -> Dict:
    query_l = query.lower()

    # ----------------------------
    # NO EVIDENCE
    # ----------------------------
    if not chunks:
        return {
            "type": "general",
            "summary": "I don’t have strong enough evidence to answer that confidently yet.",
            "data": {},
            "_confidence": 0.0,
            "_has_evidence": False,
            "sources": []
        }

    # ----------------------------
    # SOURCES
    # ----------------------------
    sources = [
        {"source": c["source"], "url": c["url"]}
        for c in chunks
        if c.get("source") and c.get("url")
    ]

    # ----------------------------
    # DETECT REQUESTED MUSCLES
    # ----------------------------
    muscle_map = {
        "chest": "chest",
        "triceps": "triceps",
        "biceps": "biceps",
        "back": "back",
        "shoulder": "shoulders",
        "shoulders": "shoulders",
        "legs": "legs",
        "quads": "legs",
        "hamstrings": "legs",
    }

    requested_muscles = {
        v for k, v in muscle_map.items() if k in query_l
    }

    # ----------------------------
    # WORKOUT PATH
    # ----------------------------
    if any(k in query_l for k in ("workout", "exercise", "train", "hypertrophy")):
        record = chunks[0]
        exercises = record.get("exercises", [])

        # 🔒 FILTER EXERCISES BY REQUESTED MUSCLE
        if requested_muscles:
            filtered_exercises = []
            for ex in exercises:
                name = ex.get("name", "").lower()

                # simple, deterministic name-based filtering
                if "tricep" in name and "triceps" not in requested_muscles:
                    continue
                if "bicep" in name and "biceps" not in requested_muscles:
                    continue

                filtered_exercises.append(ex)
        else:
            filtered_exercises = exercises

        return {
            "type": "workout_plan",
            "summary": f"{record.get('primary_muscle_group', '').title()} focused hypertrophy session.",
            "data": {
                "goal": record.get("goal"),
                "primary_muscle_group": record.get("primary_muscle_group"),
                "experience_level": record.get("experience_level"),
                "exercises": filtered_exercises,
            },
            "_confidence": 0.9,
            "_has_evidence": True,
            "sources": sources,
            "presentation": {
                "tone": "coach",
                "format": "table",
                "cta": "Save workout to Library"
            }
        }

    # ----------------------------
    # FALLBACK
    # ----------------------------
    return {
        "type": "general",
        "summary": "Here’s what current evidence suggests.",
        "data": {},
        "_confidence": 0.0,
        "_has_evidence": False,
        "sources": sources
    }
