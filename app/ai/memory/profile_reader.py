from typing import Dict

class ProfileReader:
    """
    Adapter to read user profile fields from the primary DB models.
    This file should map DB profiles -> agent-friendly profile dicts.
    """

    def to_agent_profile(self, db_profile) -> Dict:
        # Placeholder: convert DB model to dictionary for agents
        return {
            "id": getattr(db_profile, "id", None),
            "name": getattr(db_profile, "name", None),
            "age": getattr(db_profile, "age", None),
            "height_cm": getattr(db_profile, "height_cm", None),
            "weight_kg": getattr(db_profile, "weight_kg", None),
            "goals": getattr(db_profile, "goals", None),
        }
