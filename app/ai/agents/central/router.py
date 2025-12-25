from typing import Dict


def route_task_to_agent(task: Dict) -> str:
    """
    Maps a task dictionary to an agent name registered
    in the AgentRegistry.

    This is intentionally very simple now, but the structure
    allows easy upgrades later (LLM routing, scoring, skills).
    """

    task_type = (task.get("type") or "").lower()

    mapping = {
        "fitcoach": "fitcoach",      # fitness-related agent
        "nutrition": "nutrition",    # diet / meals agent
        "planner": "planner",        # fallback planning agent
        "tools": "tools",            # tool execution agent
    }

    # If type recognized → return mapped agent
    if task_type in mapping:
        return mapping[task_type]

    # If task explicitly provides "agent"
    if task.get("agent"):
        return task["agent"]

    # Final fallback: send to assistant-style agent
    return "assistant"
