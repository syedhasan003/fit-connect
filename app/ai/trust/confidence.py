def compute_answer_confidence(
    rag_used: bool,
    rag_confidence: float,
    is_sensitive: bool
) -> float:
    """
    Central trust score.
    """
    base = 0.7 if not rag_used else rag_confidence

    if is_sensitive:
        base -= 0.15

    return max(min(base, 1.0), 0.0)
