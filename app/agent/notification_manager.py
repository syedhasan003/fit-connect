"""
notification_manager.py
========================
Foundation C — WebSocket connection manager + push notification service.

Maintains a registry of active WebSocket connections keyed by user_id.
Any background agent can call `push(user_id, event)` to deliver a real-time
notification to the user's open app session.

Notification event schema:
  {
    "type":    "morning_brief" | "nudge" | "reminder" | "adaptation" | "insight",
    "title":   str,
    "body":    str,
    "data":    dict   (optional extra payload)
  }
"""

import asyncio
import json
import logging
from collections import defaultdict
from typing import Dict, List

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class NotificationManager:
    """Thread-safe registry of user WebSocket connections."""

    def __init__(self):
        # user_id → list of active WebSocket connections (user may have multiple tabs)
        self._connections: Dict[int, List[WebSocket]] = defaultdict(list)
        self._lock = asyncio.Lock()

    # ──────────────────────────────────────────────────────────
    # Connection lifecycle
    # ──────────────────────────────────────────────────────────

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].append(websocket)
        logger.info(f"[NotifManager] User {user_id} connected ({len(self._connections[user_id])} sockets).")

    async def disconnect(self, user_id: int, websocket: WebSocket):
        async with self._lock:
            conns = self._connections.get(user_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(user_id, None)
        logger.info(f"[NotifManager] User {user_id} disconnected.")

    # ──────────────────────────────────────────────────────────
    # Push to a specific user
    # ──────────────────────────────────────────────────────────

    async def push(self, user_id: int, event: dict):
        """
        Send a notification event to all open sockets for user_id.
        Stale sockets are removed automatically.
        """
        async with self._lock:
            sockets = list(self._connections.get(user_id, []))

        if not sockets:
            logger.debug(f"[NotifManager] User {user_id} has no active connections — event queued in DB.")
            await self._persist_pending(user_id, event)
            return

        payload = json.dumps(event)
        dead = []
        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        # Clean up dead connections
        if dead:
            async with self._lock:
                for ws in dead:
                    try:
                        self._connections[user_id].remove(ws)
                    except ValueError:
                        pass

    # ──────────────────────────────────────────────────────────
    # Broadcast to all connected users
    # ──────────────────────────────────────────────────────────

    async def broadcast(self, event: dict):
        async with self._lock:
            user_ids = list(self._connections.keys())
        for uid in user_ids:
            await self.push(uid, event)

    # ──────────────────────────────────────────────────────────
    # Persist pending notifications for offline users
    # ──────────────────────────────────────────────────────────

    async def _persist_pending(self, user_id: int, event: dict):
        """Store notification in DB so it can be fetched on next app open."""
        try:
            from app.db.database import SessionLocal
            from app.models.health_memory import HealthMemory

            db = SessionLocal()
            try:
                memory = HealthMemory(
                    user_id=user_id,
                    category="notification",
                    source="system",
                    content={
                        "pending": True,
                        "event_type": event.get("type"),
                        "title": event.get("title"),
                        "body": event.get("body"),
                        "data": event.get("data", {}),
                    },
                )
                db.add(memory)
                db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"[NotifManager] Failed to persist pending notification: {e}")

    # ──────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────

    def is_online(self, user_id: int) -> bool:
        return bool(self._connections.get(user_id))

    def online_user_ids(self) -> List[int]:
        return list(self._connections.keys())


# Global singleton — import this everywhere
notif_manager = NotificationManager()
