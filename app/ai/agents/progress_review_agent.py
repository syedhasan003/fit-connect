from app.ai.agents.base_agent import BaseAgent

class ProgressReviewAgent(BaseAgent):
    def __init__(self):
        super().__init__("app/ai/prompts/progress_review_prompt.txt")
