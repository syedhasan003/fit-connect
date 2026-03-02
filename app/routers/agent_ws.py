"""
agent_ws.py
===========
Foundation C — WebSocket endpoint for real-time agent notifications.

Frontend connects to: ws://localhost:8000/ws/agent?token=<jwt>

On connect: authenticates the user, registers the socket with NotificationManager.
On disconnect: removes the socket from registry.

The frontend receives JSON events:
  {
    "type":  "morning_brief" | "nudge" | "reminder" | "adaptation" | "insight" | "notification",
    "title": str,
    "body":  str,
    "data":  dict
  }

On first connect, any pending offline notifications are delivered immediately.
"""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.agent.notification_manager import notif_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Agent WebSocket"])


def _authenticate_ws(token: str, db: Session):
    """Validate JWT and return the user. Returns None on failure."""
    try:
        from jose import jwt
        from app.models.user import User
        from app.core.config import settings  # ← same secret as rest of app

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub", 0))
        if not user_id:
            return None
        return db.query(User).filter_by(id=user_id).first()
    except Exception as e:
        logger.debug(f"[AgentWS] Auth failed: {e}")
        return None


async def _deliver_pending(user_id: int, ws: WebSocket, db: Session):
    """Send any pending offline notifications to the newly connected user."""
    try:
        import json
        from app.models.health_memory import HealthMemory

        pending = (
            db.query(HealthMemory)
            .filter(
                HealthMemory.user_id == user_id,
                HealthMemory.category == "notification",
            )
            .order_by(HealthMemory.created_at.asc())
            .limit(10)
            .all()
        )

        for mem in pending:
            c = mem.content or {}
            if c.get("pending"):
                await ws.send_text(json.dumps({
                    "type": c.get("event_type", "notification"),
                    "title": c.get("title", ""),
                    "body": c.get("body", ""),
                    "data": c.get("data", {}),
                }))
                # Mark as delivered
                mem.content = {**c, "pending": False}
                db.commit()
    except Exception as e:
        logger.debug(f"[AgentWS] Pending delivery error: {e}")


@router.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket, token: str = Query(...)):
    """
    Main WebSocket endpoint. Authenticated users connect here to receive
    real-time agent events (nudges, briefs, reminders, adaptations).
    """
    db = SessionLocal()
    user = None

    try:
        user = _authenticate_ws(token, db)
        if not user:
            await websocket.close(code=4001)
            logger.warning("[AgentWS] Rejected unauthenticated connection.")
            return

        await notif_manager.connect(user.id, websocket)

        # Deliver any pending offline notifications immediately
        await _deliver_pending(user.id, websocket, db)

        # Send a welcome ping so the frontend knows we're live
        import json
        await websocket.send_text(json.dumps({
            "type": "connected",
            "title": "Agent online",
            "body": "Real-time agent channel established.",
            "data": {"user_id": user.id},
        }))

        # Keep the connection alive — wait for client messages or disconnect
        while True:
            try:
                msg = await websocket.receive_text()
                # Handle ping/pong keepalive
                if msg == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[AgentWS] Unexpected error: {e}")
    finally:
        if user:
            await notif_manager.disconnect(user.id, websocket)
        db.close()
