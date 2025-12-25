import json
from app.ai.orchestrator.llm_engine import LLMEngine

class BaseAgent:
    def __init__(self, system_prompt_path: str):
        self.system_prompt = self._load_prompt(system_prompt_path)
        self.llm = LLMEngine()

    def _load_prompt(self, path: str):
        with open(path, "r") as f:
            return f.read()

    async def respond(self, user_message: str):
        raw = await self.llm.generate(self.system_prompt, user_message)

        try:
            return json.loads(raw)
        except Exception:
            return {
                "title": "Let’s make this easier.",
                "summary": raw,
                "suggestions": [
                    "Try asking more specifically.",
                    "Tell me your goal, timeline, or preferences.",
                    "Share your current habits so I can personalize better."
                ],
                "next_steps": "What would you like to focus on first?"
            }
