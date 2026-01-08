from enum import Enum
from typing import Optional

class Intent(str, Enum):
    RAG_QUESTION = "rag_question"
    LLM_ONLY = "llm_only"
    REMINDER_CREATE = "reminder_create"
    REMINDER_LIST = "reminder_list"
    REMINDER_UPDATE = "reminder_update"


REMINDER_CREATE_KEYWORDS = [
    "remind me", "set a reminder", "add reminder", "schedule"
]

REMINDER_LIST_KEYWORDS = [
    "my reminders", "show reminders", "list reminders"
]

REMINDER_UPDATE_KEYWORDS = [
    "delete reminder", "remove reminder", "turn off reminder",
    "pause reminder", "resume reminder", "edit reminder"
]

RAG_KEYWORDS = [
    "protein", "calories", "nutrition", "diet", "workout",
    "exercise", "sets", "reps", "sleep", "recovery",
    "hypertrophy", "muscle", "fat loss"
]


def classify_intent_rules(message: str) -> Optional[Intent]:
    msg = message.lower()

    # Reminder creation
    if any(k in msg for k in REMINDER_CREATE_KEYWORDS):
        return Intent.REMINDER_CREATE

    # Reminder listing
    if any(k in msg for k in REMINDER_LIST_KEYWORDS):
        return Intent.REMINDER_LIST

    # Reminder update
    if any(k in msg for k in REMINDER_UPDATE_KEYWORDS):
        return Intent.REMINDER_UPDATE

    # RAG factual questions
    if any(k in msg for k in RAG_KEYWORDS):
        return Intent.RAG_QUESTION

    return None

def classify_intent_llm(message: str) -> Intent:
    """
    LLM fallback classifier.
    For demo, this is intentionally conservative.
    """
    msg = message.lower()

    # If user is asking to DO something actionable → reminder
    if "remind" in msg:
        return Intent.REMINDER_CREATE

    # If asking a factual question
    if msg.endswith("?"):
        return Intent.RAG_QUESTION

    # Default
    return Intent.LLM_ONLY


def classify_intent(message: str) -> Intent:
    """
    Rule-based first, LLM fallback second.
    """
    rule_intent = classify_intent_rules(message)
    if rule_intent:
        return rule_intent

    return classify_intent_llm(message)