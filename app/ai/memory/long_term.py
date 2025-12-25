class LongTermMemory:
    """
    Long-term memory for persistent user information.
    This can be backed by DB or vector store (later).
    """

    def __init__(self):
        self.store = {}

    def save(self, user_id: str, key: str, value):
        self.store.setdefault(user_id, {})[key] = value

    def read(self, user_id: str, key: str):
        return self.store.get(user_id, {}).get(key)
