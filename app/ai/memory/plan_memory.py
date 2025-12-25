class PlanMemory:
    """
    Keeps track of generated plans per user and plan versions.
    """

    def __init__(self):
        self.plans = {}

    def save_plan(self, user_id: str, plan_id: str, plan_data: dict):
        self.plans.setdefault(user_id, {})[plan_id] = plan_data

    def get_plan(self, user_id: str, plan_id: str):
        return self.plans.get(user_id, {}).get(plan_id)
