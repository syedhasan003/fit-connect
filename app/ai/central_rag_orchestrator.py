from app.ai.rag.retrieval.retriever import RagRetriever
from app.ai.rag.answer_builder import build_answer
from app.ai.trust.user_safe_responses import safe_fallback
from app.ai.trust.gates import trust_gate
from app.ai.intent_router import classify_intent, Intent
from app.ai.presentation.presentation_builder import build_presentation


class CentralRAGOrchestrator:
    def __init__(self):
        self.retriever = RagRetriever()

    def answer(self, query: str) -> dict:
        intent = classify_intent(query)
        ql = query.lower()

        # ---------------- REMINDER / SYSTEM ----------------
        if intent in (Intent.REMINDER_CREATE, Intent.REMINDER_LIST):
            return {
                "answer": "Reminder noted.",
                "_intent": intent.value,
                "_trust_state": "allowed"
            }

        # ---------------- LLM ONLY ----------------
        if intent == Intent.LLM_ONLY:
            return {
                "answer": "What goal would you like help with today?",
                "_intent": "llm_only",
                "_trust_state": "allowed"
            }

        # ---------------- RAG PATH ----------------
        chunks = self.retriever.retrieve(query)

        if not chunks:
            return safe_fallback("no_evidence")

        synthesis = build_answer(query, chunks)
        confidence = synthesis.get("_confidence", 0.0)

        # -------- MEDICAL SAFETY HARD BLOCK --------
        if any(x in ql for x in ("cancer", "cure", "disease")) and confidence < 0.8:
            return safe_fallback("medical_safety")

        response = {
            "type": synthesis.get("type"),
            "summary": synthesis.get("summary"),
            "data": synthesis.get("data"),
            "confidence": confidence,
            "sources": synthesis.get("sources", []),
            "_intent": "rag",
            "_trust_state": "allowed"
        }

        response = build_presentation(response)
        return trust_gate(response)


# 🔒 SINGLE STABLE ENTRYPOINT
_orchestrator = CentralRAGOrchestrator()


def answer_with_rag_and_trust(user_query: str) -> dict:
    """
    DO NOT CHANGE THIS SIGNATURE.
    """
    return _orchestrator.answer(user_query)
