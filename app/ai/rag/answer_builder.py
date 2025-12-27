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
    sources = []
    for c in chunks:
        if c.get("source") and c.get("url"):
            sources.append({
                "source": c["source"],
                "url": c["url"]
            })

    # ----------------------------
    # NUTRITION
    # --------------------------
    if any(k in query_l for k in ("protein", "diet", "nutrition", "calories", "keto")):
        nutrition_chunks = [c for c in chunks if c.get("topic") == "nutrition"]

        if not nutrition_chunks:
            return {
                "type": "general",
                "summary": "I don’t have strong enough evidence to answer that confidently yet.",
                "data": {},
                "_confidence": 0.0,
                "_has_evidence": False,
                "sources": sources
            }

        record = nutrition_chunks[0]

        return {
            "type": "diet_plan",
            "summary": (
                "Adequate daily protein intake and even distribution across meals "
                "are key for muscle growth."
            ),
            "data": record,
            "_confidence": 0.9,
            "_has_evidence": True,
            "sources": sources,
            "presentation": {
                "tone": "coach",
                "format": "table",
              "cta": "Save diet to Library"
            }
        }

    # ----------------------------
    # WORKOUTS
    # ----------------------------
    if any(k in query_l for k in ("workout", "hypertrophy", "exercise", "train")):
        muscle_map = {
            "shoulder": "shoulders",
            "shoulders": "shoulders",
            "back": "back",
            "biceps": "biceps",
            "chest": "chest",
            "triceps": "triceps",
            "legs": "legs"
        }

        requested = None
        for k, v in muscle_map.items():
            if k in query_l:
                requested = v
                break

        filtered = []
        for c in chunks:
            pmg = c.get("primary_muscle_group", "").lower()
            if requested and requested in pmg:
                filtered.append(c)

        if not filtered:
            return {
                "type": "general",
                "summary": "I don’t have strong enough evidence to answer that confidently yet.",
              "data": {},
                "_confidence": 0.0,
                "_has_evidence": False,
                "sources": sources
            }

        record = filtered[0]

        return {
            "type": "workout_plan",
            "summary": f"{record.get('day')} focused hypertrophy session.",
            "data": {
                "goal": record.get("goal"),
                "muscle_group": record.get("primary_muscle_group"),
                "experience_level": record.get("experience_level"),
                "exercises": record.get("exercises", [])
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
        "summary": "Here’s what current evidencsuggests.",
        "data": {},
        "_confidence": 0.0,
        "_has_evidence": False,
        "sources": sources
    }
