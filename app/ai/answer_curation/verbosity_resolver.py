from typing import Literal


Verbosity = Literal["short", "medium", "detailed"]


def resolve_verbosity(
    *,
    response_type: str,
    severity: str,
    requires_confirmation: bool,
) -> Verbosity:
    """
    Determines response verbosity.

    Rules:
    - Ask responses → short
    - High severity → detailed
    - Requires confirmation → detailed
    - Inform responses → medium
    - Warn responses → detailed
    """

    if response_type == "ask":
        return "short"

    if severity == "high":
        return "detailed"

    if requires_confirmation:
        return "detailed"

    if response_type == "warn":
        return "detailed"

    return "medium"
