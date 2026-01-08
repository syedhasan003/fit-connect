from app.ai.agents.base_agent import BaseAgent

class SafetyAgent(BaseAgent):
    def __init__(self):
        super().__init__("safety_prompt.txt")
