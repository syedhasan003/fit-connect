import pathlib

PROMPT_PATH = pathlib.Path(__file__).parent / "habit_prompt.txt"

def load_habit_prompt():
    return PROMPT_PATH.read_text()
