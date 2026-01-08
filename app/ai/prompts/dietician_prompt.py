import pathlib

PROMPT_PATH = pathlib.Path(__file__).parent / "dietician_prompt.txt"

def load_dietician_prompt():
    return PROMPT_PATH.read_text()
