def apply_coach_tone(answer: dict) -> dict:
    """
    Adds a light coach / gym-bro tone to explanations
    WITHOUT modifying factual content or structured data.
    """

    if "summary" not in answer or not answer["summary"]:
        return answer

    intro = answer["summary"]

    toned_intro = (
        "Alright — let’s break this down cleanly.\n\n"
        f"{intro}\n\n"
        "No fluff, no nonsense — just what actually works."
    )

    answer["summary"] = toned_intro
    return answer
