from app.ai.agents.base_agent import BaseAgent

class HabitAgent(BaseAgent):
    def __init__(self):
        super().__init__("app/ai/prompts/habit_prompt.txt")
