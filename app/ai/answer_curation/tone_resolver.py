from typing import Literal


Tone = Literal["supportive", "neutral", "firm"]


def resolve_tone(
    *,
    confidence: float,
    severity: str,
) -> Tone:
    """
    Determines response tone.

    Rules:
    - High confidence + low severity → supportive
    - Medium confidence or medium severity → neutral
    - High severity or low confidence → firm
    """

    if severity == "high":
        return "firm"

    if confidence < 0.6:
        return "firm"

    if confidence < 0.8:
        return "neutral"

    return "supportive"
