class DieticianAgent:
    async def run(self, payload):
        goal = payload.get("goal", "")

        return {
            "type": "meal_plan",
            "meals": [
                "Oatmeal + fruit",
                "Grilled chicken salad",
                "Fish + veggies"
            ],
            "note": f"Generated for: {goal}"
        }

    async def handle(self, payload):
        return await self.run(payload)
