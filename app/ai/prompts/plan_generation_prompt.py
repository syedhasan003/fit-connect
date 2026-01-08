import pathlib

PROMPT_PATH = pathlib.Path(__file__).parent / "plan_generation_prompt.txt"

def load_plan_generation_prompt():
    return PROMPT_PATH.read_text()
