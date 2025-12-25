import asyncio
from app.ai.agents.base_agent import BaseAgent


class CoachAgent(BaseAgent):
    def __init__(self):
        super().__init__(system_prompt_path="app/ai/prompts/coach_prompt.txt")

    async def run(self, payload):
        return {
            "type": "workout_plan",
            "workout": [
                "Push-ups 3x12",
                "Squats 3x15",
                "Plank 3x45s"
            ],
            "note": "Generated workout plan"
        }

    async def handle(self, payload):
        return await self.run(payload)

    async def _handle_missed_reminder_async(self, reminder_text: str) -> str:
        """
        INTERNAL async handler that correctly calls LLMEngine
        """
        user_prompt = f"""
The user missed the following reminder:
"{reminder_text}"

Respond as a fitness mindset & motivation coach.
Be empathetic, warm, supportive, and give one small actionable step.
"""

        return await self.llm.generate(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt
        )

    def handle_missed_reminder(self, user_id: int, reminder_text: str) -> str:
        """
        SYNC-safe wrapper used by services
        """
        return asyncio.run(self._handle_missed_reminder_async(reminder_text))
