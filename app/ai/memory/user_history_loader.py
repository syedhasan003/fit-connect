class UserHistoryLoader:
    """
    Loads historical user interactions, plans, and logs for context.
    Currently returns placeholders; later will query DB.
    """

    def load_history(self, user_id: str, limit: int = 50):
        # Return placeholder list of past events
        return []
