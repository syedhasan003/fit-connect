import pathlib

PROMPT_PATH = pathlib.Path(__file__).parent / "metrics_prompt.txt"

def load_metrics_prompt():
    return PROMPT_PATH.read_text()
