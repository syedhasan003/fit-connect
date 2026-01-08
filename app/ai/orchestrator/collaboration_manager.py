import asyncio
from typing import Any, Dict, List, Optional

from app.ai.agent_registry import AgentRegistry
from app.ai.orchestrator.state_manager import state_manager


class CollaborationManager:
    """
    Orchestrator-level collaboration helper.
    IMPORTANT:
        - Does NOT create a registry
        - Uses the shared registry instance passed by orchestrator
        - CentralAgent depends on async call_agent() & broadcast()
    """

    def __init__(self, registry: AgentRegistry, state_mgr):
        self.registry = registry
        self.state = state_mgr
        self._lock = asyncio.Lock()

    async def call_agent(self, name: str, payload: Any, candidates: Optional[List[str]] = None):
        """
        Attempts to run an agent using common method names:
        - run
        - handle
        - respond
        - generate
        - process
        """
        if candidates is None:
            candidates = ["run", "handle", "respond", "generate", "process"]

        agent_obj = self.registry.get_agent(name)
        if agent_obj is None:
            raise RuntimeError(f"Agent '{name}' not found in registry")

        last_err = None
        for method in candidates:
            fn = getattr(agent_obj, method, None)
            if fn is None:
                continue

            try:
                res = fn(payload)
                if asyncio.iscoroutine(res):
                    res = await res
                return res
            except Exception as e:
                last_err = e
                continue

        raise RuntimeError(f"Agent '{name}' failed on all known methods. Last error: {last_err}")

    async def broadcast(self, agent_names: List[str], payload: Any):
        """
        Calls multiple agents concurrently.
        """
        results = {}

        async def one(agent):
            try:
                result = await self.call_agent(agent, payload)
                results[agent] = {"ok": True, "result": result}
            except Exception as e:
                results[agent] = {"ok": False, "error": str(e)}

        tasks = [asyncio.create_task(one(a)) for a in agent_names]
        await asyncio.gather(*tasks)

        return results

    async def orchestrate_flow(self, goal: str, candidate_agents: Optional[List[str]] = None):
        """
        High-level orchestration: prefers central if available.
        """
        # Prefer central
        if self.registry.get_agent("central"):
            try:
                return await self.call_agent("central", {"goal": goal})
            except Exception:
                pass

        # Fallback: iterate workers
        candidate_agents = candidate_agents or list(self.registry.agents.keys())
        for agent_name in candidate_agents:
            if agent_name == "central":
                continue
            try:
                return await self.call_agent(agent_name, {"goal": goal})
            except Exception:
                continue

        raise RuntimeError("No agent could handle orchestration flow.")
