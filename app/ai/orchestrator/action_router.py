from app.ai.actions.generate_workout_plan import GenerateWorkoutPlanAction
from app.ai.actions.generate_nutrition_plan import GenerateNutritionPlanAction
from app.ai.actions.generate_habit_plan import GenerateHabitPlanAction
from app.ai.actions.adjust_plan import AdjustPlanAction
from app.ai.actions.review_progress import ReviewProgressAction
from app.ai.actions.log_weight import LogWeightAction
from app.ai.actions.log_activity import LogActivityAction


class ActionRouter:
    """
    Executes backend actions triggered by agent analysis.
    """

    def __init__(self):
        self.registry = {
            "generate_workout_plan": GenerateWorkoutPlanAction(),
            "generate_nutrition_plan": GenerateNutritionPlanAction(),
            "generate_habit_plan": GenerateHabitPlanAction(),
            "adjust_plan": AdjustPlanAction(),
            "review_progress": ReviewProgressAction(),
            "log_weight": LogWeightAction(),
            "log_activity": LogActivityAction(),
        }

    def execute(self, action_name: str, user_id: str):
        action = self.registry.get(action_name)

        if not action:
            return {"error": "Unknown action"}

        return action.run(user_id, params={})
