from app.ai.agents.base_agent import BaseAgent

class RecommendationAgent(BaseAgent):
    def __init__(self):
        super().__init__("app/ai/prompts/recommendation_prompt.txt")
