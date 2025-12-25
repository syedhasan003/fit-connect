from app.ai.agents.base_agent import BaseAgent

class TrainerAgent(BaseAgent):
    def __init__(self):
        super().__init__("app/ai/prompts/trainer_prompt.txt")
