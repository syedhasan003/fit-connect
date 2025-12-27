def trust_gate(response: dict) -> dict:
    # Respect upstream block
    if response.get("_trust_state") == "blocked":
        return response

    # Evidence present → always allow
    if response.get("sources"):
        response["_trust_state"] = "allowed"
        return response

    # Otherwise block
    return {
        "title": "Let’s take a safer approach",
        "summary": "I don’t have strong enough evidence to answer that confidently.",
        "_confidence": 0.0,
        "_trust_state": "blocked",
        "_reason": "no_evidence"
    }
