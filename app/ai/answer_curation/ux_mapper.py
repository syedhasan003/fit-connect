def map_response_location(
    *,
    response_type: str,
    severity: str,
) -> str:
    """
    Decides WHERE the response appears in the UI.
    """

    if response_type == "ask":
        return "modal"

    if severity == "high":
        return "home_alert"

    if response_type == "warn":
        return "home_alert"

    return "home_feed"
