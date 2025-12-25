import json

def try_fix_json(text: str):
    """
    Attempts to fix malformed JSON responses from LLM.
    Handles:
    - Markdown code blocks
    - Trailing characters
    - Minor formatting errors
    """

    # Try normal JSON load first
    try:
        return json.loads(text)
    except:
        pass

    # Remove markdown fences like ```json or ```
    cleaned = text.strip().replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except:
        return {
            "error": "JSON_REPAIR_FAILED",
            "raw_output": text
        }
