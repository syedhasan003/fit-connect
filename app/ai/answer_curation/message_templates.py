"""
Message templates used by Answer Curation Engine.
Deterministic, UI-safe, calm coach-like language.
"""

TEMPLATES = {
    "reduce_workout_intensity": {
        "short": "I reduced today’s workout intensity slightly.",
        "medium": (
            "I slightly reduced today’s workout intensity so your body can recover "
            "while you stay consistent."
        ),
        "detailed": (
            "I noticed that a few workouts were missed recently, so I reduced today’s "
            "workout intensity slightly. This helps your body recover without breaking "
            "your routine."
        ),
    },

    "simplify_diet_plan": {
        "short": "I simplified your diet plan for today.",
        "medium": (
            "I simplified today’s diet plan to make it easier to follow "
            "and stay on track."
        ),
        "detailed": (
            "Since diet adherence was a bit low recently, I simplified todayplan. "
            "This makes it easier to follow while still supporting your goals."
        ),
    },

    "substitute_exercise": {
        "short": "I swapped one exercise for an easier alternative.",
        "medium": (
            "I replaced one exercise with a safer alternative "
            "that works the same muscles."
        ),
        "detailed": (
            "I noticed one exercise might be contributing to fatigue, so I substituted it "
            "with a safer alternative that targets the same movement pattern."
        ),
    },
}
