from typing import List, Dict

from app.ai.answer_curation.engine import curate_answer


def assemble_curated_responses(
    *,
    decisions: List[Dict],
) -> List[Dict]:
    """
    Converts raw AI decisions into safe, curated user responses.
    """

    responses = []

    for d in decisions:
        response = curate_answer(
            action=d["action"],
            reason=d.get("reason", ""),
            response_type=d.get("response_type", "inform"),
            severity=d.get("severity", "low"),
            confidence=d.get("confidence", 0.8),
            requires_confirmation=d.get("requires_confirmation", False),
        )

        responses.append(response.model_dump())

    return responses
