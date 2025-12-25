import pathlib

PROMPT_PATH = pathlib.Path(__file__).parent / "recommendation_prompt.txt"

def load_recommendation_prompt():
    return PROMPT_PATH.read_text()
