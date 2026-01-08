class ShortTermMemory:
    """
    Short-term conversational memory.
    Stores last N messages for session context (ephemeral).
    """

    def __init__(self, window_size: int = 10):
        self.window_size = window_size
        self.store = {}

    def push(self, user_id: str, message: dict):
        self.store.setdefault(user_id, []).append(message)
        if len(self.store[user_id]) > self.window_size:
            self.store[user_id] = self.store[user_id][-self.window_size:]

    def get(self, user_id: str):
        return self.store.get(user_id, [])
