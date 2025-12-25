class AgentRouter:
    """
    Maps user messages to the correct AI agent based on intent.
    """

    def choose_agent(self, message: str) -> str:
        msg = message.lower()

        # --- Trainer Agent ---
        if any(word in msg for word in [
            "workout", "exercise", "split", "training", "gym plan", "routine"
        ]):
            return "trainer"

        # --- Dietician Agent ---
        if any(word in msg for word in [
            "diet", "meal", "nutrition", "macros", "calories", "eat", "food"
        ]):
            return "dietician"

        # --- Habit Agent ---
        if any(word in msg for word in [
            "habit", "consistency", "discipline", "routine habits"
        ]):
            return "habit"

        # --- Coach (Mindset) Agent ---
        if any(word in msg for word in [
            "motivation", "mindset", "feel", "struggling", "i can't", "i feel", "burnout"
        ]):
            return "coach"

        # --- Metrics Agent ---
        if any(word in msg for word in [
            "progress", "am i improving", "tracking", "stats", "plateau"
        ]):
            return "metrics"

        # --- Recommendation Agent ---
        if any(word in msg for word in [
            "what should i do", "what next", "fix", "improve", "recommend"
        ]):
            return "recommendation"

        # --- Plan Generator Agent ---
        if any(word in msg for word in [
            "6 week", "8 week", "plan", "long term", "program", "periodization"
        ]):
            return "plan_generator"

        # --- Progress Review Agent ---
        if any(word in msg for word in [
            "review", "month review", "weekly review", "how did i do"
        ]):
            return "progress_review"

        # Default fallback → mindset coach (safest)
        return "coach"

    def identify_action(self, message: str):
        """
        Placeholder for future automated actions (logging, reminders, etc.)
        """
        return None
