from typing import Dict

def coach_preset(answer_type: str) -> Dict:
    if answer_type == "workout_plan":
        return {
            "tone": "coach",
            "format": "table",
            "intro_style": "motivational",
            "cta": "Save workout to Library",
            "emphasis": ["progressive overload", "train close to failure", "recovery"]
        }

    if answer_type == "diet_plan":
        return {
            "tone": "coach",
            "format": "table",
            "intro_style": "educational",
            "cta": "Save diet to Library",
            "emphasis": ["daily protein target", "meal distribution"]
        }

    return {
        "tone": "neutral",
        "format": "bullets",
        "cta": "Save",
        "emphasis": []
    }
