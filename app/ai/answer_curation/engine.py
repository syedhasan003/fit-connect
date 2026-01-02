from app.ai.answer_curation.schema import CuratedAnswer
from app.ai.answer_curation.tone_resolver import resolve_tone
from app.ai.answer_curation.verbosity_resolver import resolve_verbosity
from app.ai.answer_curation.message_templates import TEMPLATES
from app.ai.answer_curation.cta_builder import build_cta


def curate_answer(
    *,
    action: str,
    reason: str,
    response_type: str,
    severity: str,
    confidence: float,
    requires_confirmation: bool,
) -> CuratedAnswer:
    """
    Final deterministic answer builder.
    """

    tone = resolve_tone(confidence=confidence, severity=severity)
    verbosity = resolve_verbosity(
        response_type=response_type,
        severity=severity,
        requires_confirmation=requires_confirmation,
    )

    message = TEMPLATES[action][tone][verbosity]

    cta = build_cta(
        requires_confirmation=requires_confirmation,
        action=action,
    )

    return CuratedAnswer(
        response_type=response_type,
        tone=tone,
        message=message,
        follow_up=reason,
        cta=cta,
        confidence=confidence,
    )
