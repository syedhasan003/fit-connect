class LLMService:
    """
    Handles communication with the LLM provider.
    Currently uses a placeholder fake model.
    """

    def __init__(self):
        self.model_name = "fake-test-model"  # Replace later

    def ask(self, prompt: str):
        """
        Sends prompt to the language model.
        Currently returns a placeholder response.
        """
        return {
            "reply": "This is a placeholder intelligent response.",
            "raw_output": "placeholder_response"
        }


# Singleton instance
llm = LLMService()
