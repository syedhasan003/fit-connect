from typing import List, Dict, Set

# RAG IS EVIDENCE ONLY — NEVER ACTION
SAFE_TOPICS: Set[str] = {
    "nutrition",
    "workouts",
    "recovery",
    "exercise safety",
    "fitness",
    "sleep",
}


def build_answer(query: str, chunks: List[Dict]) -> Dict:
    """
    RAG ANSWER BUILDER (STRICT MODE)

    HARD RULES:
    - RAG MUST NEVER generate workout plans
    - RAG MUST NEVER list exercises
    - RAG MUST NEVER prescribe routines
    - RAG PROVIDES EVIDENCE + PRINCIPLES ONLY
    """

    query_l = query.lower()

    # -------------------------------------------------
    # NO EVIDENCE
    # -------------------------------------------------
    if not chunks:
        return {
            "type": "evidence",
            "summary": "I don’t have strong enough evidence to answer that confidently yet.",
            "data": {},
            "_confidence": 0.0,
            "_has_evidence": False,
            "sources": [],
        }

    # -------------------------------------------------
    # SOURCES (DEDUPED)
    # -------------------------------------------------
    sources = []
    seen = set()

    for c in chunks:
        src = c.get("source")
        url = c.get("url")
        if src and url and (src, url) not in seen:
            sources.append({"source": src, "url": url})
            seen.add((src, url))

    # -------------------------------------------------
    # WORKOUT / TRAINING QUESTIONS → EVIDENCE ONLY
    # -------------------------------------------------
    if any(k in query_l for k in ("workout", "exercise", "train", "hypertrophy")):
        return {
            "type": "evidence",
            "summary": "Here’s what evidence-based training principles suggest.",
            "data": {
                "principles": [
                    {
                        "claim": c.get("claim"),
                        "evidence": c.get("evidence"),
                        "source": c.get("source"),
                    }
                    for c in chunks
                    if c.get("claim")
                ]
            },
            "_confidence": 0.85,
            "_has_evidence": True,
            "sources": sources,
        }

    # -------------------------------------------------
    # NUTRITION QUESTIONS → EVIDENCE ONLY
    # -------------------------------------------------
    if any(k in query_l for k in ("protein", "calories", "nutrition", "diet", "macro")):
        return {
            "type": "evidence",
            "summary": "Here’s what current nutrition research suggests.",
            "data": {
                "principles": [
                    {
                        "claim": c.get("claim"),
                        "evidence": c.get("evidence"),
                        "source": c.get("source"),
                    }
                    for c in chunks
                    if c.get("claim")
                ]
            },
            "_confidence": 0.9,
            "_has_evidence": True,
            "sources": sources,
        }

    # -------------------------------------------------
    # SAFE GENERAL FALLBACK
    # -------------------------------------------------
    return {
        "type": "evidence",
        "summary": "Here’s what current evidence suggests.",
        "data": {
            "principles": [
                {
                    "claim": c.get("claim"),
                    "evidence": c.get("evidence"),
                    "source": c.get("source"),
                }
                for c in chunks
                if c.get("claim")
            ]
        },
        "_confidence": 0.7,
        "_has_evidence": True,
        "sources": sources,
    }
