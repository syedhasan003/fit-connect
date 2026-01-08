import pathlib

PROMPT_PATH = pathlib.Path(__file__).parent / "progress_review_prompt.txt"

def load_progress_review_prompt():
    return PROMPT_PATH.read_text()
