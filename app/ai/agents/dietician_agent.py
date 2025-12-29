from app.ai.agents.base_agent import BaseAgent

class DieticianAgent(BaseAgent):
    """
    Diet agent that produces actionable nutrition advice,
    NOT literature summaries.
    """

    def __init__(self):
        super().__init__(
            system_prompt_path="app/ai/prompts/dietician_prompt.txt"
        )

    async def respond(self, message: str) -> dict:
        response = await super().respond(message)

        # Ensure structured nutrition output
        response.setdefault("data", {})

        response["data"].setdefault(
            "macros",
            {
                "protein": "1.6–2.2 g/kg bodyweight",
                "carbs": "3–5 g/kg bodyweight",
                "fats": "0.6–1 g/kg bodyweight"
            }
        )

        response["data"].setdefault(
            "meal_examples",
            [
                "Eggs + oats + fruit",
                "Chicken, rice, vegetables",
                "Greek yogurt or paneer + nuts",
            ]
        )

        response["data"].setdefault(
            "notes",
            [
                "Prioritize protein at every meal",
                "Stay hydrated",
                "Consistency matters more than perfection",
            ]
        )

        return response
