from typing import List, Dict, Any


def plan_from_goal(goal: str) -> List[Dict[str, Any]]:
    """
    Lightweight, rule-based planner.
    Converts a high-level goal into small structured tasks.

    Later we will replace this with:
    - LLM planning
    - tool-aware planning
    - recursive refinement
    """

    tasks = []
    lower = goal.lower()

    # Simple rule triggers (expand later)
    if "workout" in lower or "fitness" in lower or "exercise" in lower:
        tasks.append({
            "type": "fitcoach",
            "input": {
                "intent": "create_workout_plan",
                "goal_text": goal
            }
        })

    if "meal" in lower or "diet" in lower or "nutrition" in lower or "food" in lower:
        tasks.append({
            "type": "nutrition",
            "input": {
                "intent": "create_meal_plan",
                "goal_text": goal
            }
        })

    # Fallback: if no rule matched, send to planner agent later
    if not tasks:
        tasks.append({
            "type": "planner",
            "input": {
                "intent": "general_reasoning",
                "goal_text": goal
            }
        })

    return tasks
