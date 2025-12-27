from typing import List, Dict


class RagRegistry:
    """
    In-memory authoritative registry for RAG facts.
    This is deterministic, auditable, and safe for production.
    """

    def __init__(self):
        self._records: List[Dict] = []

    def add(self, record: Dict):
        if not isinstance(record, dict):
            return

        required_keys = {"id", "topic", "claim", "source"}
        if not required_keys.issubset(record.keys()):
            return

        self._records.append(record)

    def export(self) -> List[Dict]:
        return self._records.copy()
