import json

def safe_json_parse(text: str):
    """
    Attempts to parse JSON. If it fails, returns raw text.
    """
    try:
        return json.loads(text)
    except:
        return {"raw_text": text}
