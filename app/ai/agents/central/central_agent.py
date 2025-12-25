import asyncio
from typing import Any, Dict, Optional

from .planner import plan_from_goal
from .router import route_task_to_agent
from .memory_interface import MemoryInterface
from .tools_interface import ToolsInterface


class CentralAgent:
    """
    Lightweight master agent (Central).
    - Uses planner to break goals into tasks.
    - Uses router to pick correct worker agent.
    - Uses memory + tools for future enhancements.
    """

    def __init__(self, registry, memory=None, tools=None):
        self.registry = registry
        self.memory = memory or MemoryInterface()
        self.tools = tools or ToolsInterface()

    #
    # Expose multiple method names because your orchestrator
    # tries: run → handle → respond → generate → process
    #
    async def run(self, payload: Dict[str, Any]):
        return await self._execute(payload)

    async def handle(self, payload: Dict[str, Any]):
        return await self._execute(payload)

    async def respond(self, payload: Dict[str, Any]):
        return await self._execute(payload)

    async def generate(self, payload: Dict[str, Any]):
        return await self._execute(payload)

    async def process(self, payload: Dict[str, Any]):
        return await self._execute(payload)

    #
    # Main logic
    #
    async def _execute(self, payload: Dict[str, Any]):
        # Normalize payload
        inp = payload.get("input", payload) if isinstance(payload, dict) else payload
        goal = inp.get("goal") if isinstance(inp, dict) else None

        if not goal:
            return {"error": "missing_goal", "note": "Central requires input.goal"}

        # Save recent goal to memory
        await self.memory.set("last_goal", goal)

        #
        # 1. Planning
        #
        tasks = plan_from_goal(goal)

        #
        # 2. Execute tasks sequentially (simple version)
        #
        results = []
        for task in tasks:
            agent_name = route_task_to_agent(task)
            agent = self.registry.get_agent(agent_name)

            if not agent:
                results.append({
                    "task": task,
                    "agent": agent_name,
                    "error": "agent_not_found"
                })
                continue

            # Agent payload
            agent_payload = {
                "input": task.get("input", {}),
                "context": {"parent_goal": goal}
            }

            result = None
            last_exc = None
            for method in ("run", "handle", "respond", "generate", "process"):
                fn = getattr(agent, method, None)
                if fn is None:
                    continue
                try:
                    maybe = fn(agent_payload)
                    if asyncio.iscoroutine(maybe):
                        maybe = await maybe
                    result = maybe
                    break
                except Exception as e:
                    last_exc = e
                    continue

            if result is None:
                results.append({
                    "task": task,
                    "agent": agent_name,
                    "error": "execution_failed",
                    "reason": str(last_exc)
                })
            else:
                results.append({
                    "task": task,
                    "agent": agent_name,
                    "result": result
                })

        #
        # 3. Save final output
        #
        final = {"goal": goal, "results": results}
        await self.memory.set(f"result:{goal}", final)

        return {
            "message": "Central completed orchestration.",
            "goal": goal,
            "tasks_executed": len(tasks),
            "final": final
        }
