import asyncio
from typing import Any, Dict, Optional


class MemoryInterface:
    """
    Lightweight async memory.
    Later replace with Redis / DB-backed memory.
    """

    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str, default: Optional[Any] = None) -> Any:
        async with self._lock:
            return self._store.get(key, default)

    async def set(self, key: str, value: Any) -> None:
        async with self._lock:
            self._store[key] = value

    async def delete(self, key: str) -> None:
        async with self._lock:
            if key in self._store:
                del self._store[key]
