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
                "summary": raw,
                "confidence": 0.5
            }
