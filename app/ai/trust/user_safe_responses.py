"""
Centralized safe fallback responses.
These are deterministic and non-hallucinatory.
"""

def safe_fallback(reason: str) -> dict:
    if reason == "no_evidence":
        return {
            "answer": (
                "I don’t have verified information for that yet. "
                "I want to make sure anything I share is accurate."
            ),
            "_trust_state": "blocked",
            "_reason": "no_evidence"
        }

    if reason == "medical_safety":
        return {
            "answer": (
                "That’s something a qualified medical professional "
                "should help you with directly."
            ),
            "_trust_state": "blocked",
            "_reason": "medical_safety"
        }

    return {
        "answer": "I’m not confident enough to answer that safely.",
        "_trust_state": "blocked",
        "_reason": "unknown"
    }


# ==================================================
# ADAPTER FUS (EXPECTED BY ORCHESTRATOR ENGINE)
# ==================================================

def soften_response(response: dict) -> dict:
    """
    Softens an allowed response slightly for tone.
    DEMO-SAFE: passthrough for now.
    """
    return response


def redirect_response(response: dict) -> dict:
    """
    Redirects unsafe responses.
    DEMO-SAFE: passthrough for now.
    """
    return response
