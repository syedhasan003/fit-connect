from typing import Dict

def safe_fallback(reason: str) -> Dict:
    return {
        "title": "Let’s take a safer approach",
        "summary": "I don’t have strong enough evidence to answer that confidently.",
        "suggestions": [
            "Consider consulting a certified professional",
            "I can suggest low-risk general guidance"
        ],
        "next_steps": "Would you like conservative advice instead?",
        "_confidence": 0.0,
        "_trust_state": "blocked",
        "_reason": reason
    }
