from app.ai.agents.base_agent import BaseAgent

class PlanAgent(BaseAgent):
    def __init__(self):
        super().__init__("app/ai/prompts/plan_generation_prompt.txt")
