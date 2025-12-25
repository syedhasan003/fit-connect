from app.ai.agents.trainer_agent import TrainerAgent
from app.ai.agents.dietician_agent import DieticianAgent
from app.ai.agents.coach_agent import CoachAgent
from app.ai.agents.metrics_agent import MetricsAgent
from app.ai.agents.habit_agent import HabitAgent
from app.ai.agents.recommendation_agent import RecommendationAgent
from app.ai.agents.plan_agent import PlanAgent
from app.ai.agents.progress_review_agent import ProgressReviewAgent
from app.ai.agents.safety_agent import SafetyAgent

class AgentRegistry:
    def __init__(self):
        self.agents = {
            "trainer": TrainerAgent(),
            "dietician": DieticianAgent(),
            "coach": CoachAgent(),
            "metrics": MetricsAgent(),
            "habit": HabitAgent(),
            "recommendation": RecommendationAgent(),
            "plan_generator": PlanAgent(),
            "progress_review": ProgressReviewAgent(),
            "safety": SafetyAgent(),
        }

    def get_agent(self, name: str):
        return self.agents.get(name)
