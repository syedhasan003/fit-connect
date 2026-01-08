class ProgressService:
    """
    Handles user progress logs, weight entries, workouts completed.
    """

    def log(self, user_id: str, data: dict):
        return {"progress_logged": True}
