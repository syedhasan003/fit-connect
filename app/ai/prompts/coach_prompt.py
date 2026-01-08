import pathlib

PROMPT_PATH = pathlib.Path(__file__).parent / "coach_prompt.txt"

def load_coach_prompt():
    return PROMPT_PATH.read_text()
