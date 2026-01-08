import asyncio
from typing import Any, Dict


class StateManager:
    """
    Simple async-safe state store for orchestrator.
    """

    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str):
        async with self._lock:
            return self._data.get(key)

    async def set_kv(self, key: str, value: Any):
        async with self._lock:
            self._data[key] = value

    async def clear(self, key: str):
        async with self._lock:
            if key in self._data:
                del self._data[key]


# Global instance — orchestrator imports THIS instance
state_manager = StateManager()
