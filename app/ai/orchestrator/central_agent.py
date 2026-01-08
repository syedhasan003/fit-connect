import asyncio
from datetime import datetime
from typing import Any, Dict

from app.ai.agent_registry import AgentRegistry
from app.ai.orchestrator.collaboration_manager import CollaborationManager
from app.ai.orchestrator.state_manager import state_manager


class CentralAgent:
    """
    Master agent that coordinates other agents.
    """

    def __init__(self, registry: AgentRegistry, collab: CollaborationManager):
        self.registry = registry
        self.collab = collab
        self.name = "central"

    async def run(self, payload: Dict[str, Any]):
        goal = (
            payload.get("goal")
            or payload.get("input", {}).get("goal")
            or payload.get("input", {}).get("goal_text")
        )

        if not goal:
            return {"status": "error", "message": "missing goal"}

        started_at = datetime.utcnow().isoformat()

        # Worker agents (exclude central)
        workers = [n for n in self.registry.agents.keys() if n != "central"]

        if not workers:
            return {"status": "no_agents", "goal": goal}

        # Get proposals from all workers
        proposals = await self.collab.broadcast(workers, {"goal": goal})

        final_doc = {
            "goal": goal,
            "proposals": proposals,
            "started_at": started_at,
        }

        # Save in state manager
        await state_manager.set_kv(f"central:last:{goal}", final_doc)

        return {"status": "ok", "final": final_doc}

    # Compatibility fallback methods for orchestrator heuristics
    async def handle(self, payload): return await self.run(payload)
    async def respond(self, payload): return await self.run(payload)
    async def generate(self, payload): return await self.run(payload)
