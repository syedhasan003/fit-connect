# Global JSON schema for ALL AI responses

STRUCTURED_OUTPUT_SCHEMA = {
    "plan_type": str,
    "title": str,
    "summary": str,

    "workout_plan": {
        "days": [
            {
                "day_title": str,
                "goal": str,
                "exercises": [
                    {
                        "name": str,
                        "sets": (str, int),
                        "reps": str,
                        "rest": str,
                        "instructions": str
                    }
                ]
            }
        ]
    },

    "diet_plan": {
        "calories": (str, int),
        "macros": {
            "protein": str,
            "carbs": str,
            "fats": str
        },
        "meals": [
            {
                "meal_name": str,
                "description": str,
                "items": list
            }
        ]
    },

    "hydration": {
        "daily_target_liters": str,
        "notes": list
    },

    "sleep": {
        "target_hours": str,
        "notes": list
    },

    "recovery": {
        "recommendations": list
    },

    "motivation": {
        "message": str
    },

    "safety_notes": {
        "notes": list
    },

    "metadata": {
        "generated_by": str,
        "created_at": str,
        "version": str
    }
}
