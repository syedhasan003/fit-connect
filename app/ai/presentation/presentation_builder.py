from typing import Dict
from app.ai.presentation.presets import coach_preset


def build_presentation(response: Dict) -> Dict:
    answer_type = response.get("type", "general")

    presentation = coach_preset(answer_type)

    response["presentation"] = {
        "tone": presentation["tone"],
        "format": presentation["format"],
        "intro_style": presentation.get("intro_style"),
        "cta": presentation["cta"],
        "emphasis": presentation.get("emphasis", [])
    }

    return response
