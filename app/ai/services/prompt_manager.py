import os

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
PROMPTS_PATH = os.path.join(os.path.dirname(BASE_PATH), "prompts")


class PromptManager:
    """
    Loads prompt text files from /ai/prompts/.
    """

    def load_prompt_file(self, name: str):
        file_path = os.path.join(PROMPTS_PATH, f"{name}.txt")
        if not os.path.exists(file_path):
            return "You are a helpful AI assistant."

        with open(file_path, "r") as f:
            return f.read()

    def get_prompt(self, agent_name: str):
        return self.load_prompt_file(agent_name)


prompt_manager = PromptManager()
