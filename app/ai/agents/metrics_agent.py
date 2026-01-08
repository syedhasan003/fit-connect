from app.ai.agents.base_agent import BaseAgent

class MetricsAgent(BaseAgent):
    def __init__(self):
        super().__init__("app/ai/prompts/metrics_prompt.txt")
