from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

class LLMEngine:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables.")

        self.client = OpenAI(api_key=api_key)
        self.fallback_prompt = self._load_fallback_prompt()

    def _load_fallback_prompt(self):
        path = "app/ai/prompts/fallback_prompt.txt"
        if os.path.exists(path):
            with open(path, "r") as f:
                return f.read()
        return "You are a helpful assistant."

    async def generate(self, system_prompt: str, user_prompt: str):
        """
        Uses the NEW OpenAI responses API (2024+)
        This works for ALL new keys and models.
        """
        try:
            response = self.client.responses.create(
                model="gpt-4o-mini",
                input=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )

            return response.output_text

        except Exception as e:
            # Fallback completion
            fallback = self.client.responses.create(
                model="gpt-4o-mini",
                input=[
                    {"role": "system", "content": self.fallback_prompt},
                    {"role": "user", "content": user_prompt},
                ]
            )

            return fallback.output_text
