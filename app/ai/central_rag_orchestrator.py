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

        # --------------------------------------------------
        # REMINDERS (handled by reminder agent later)
        # --------------------------------------------------
        if intent in (Intent.REMINDER_CREATE, Intent.REMINDER_LIST):
            return {
                "answer": "Reminder noted. I’ll handle that for you.",
                "_intent": intent.value,
                "_trust_state": "allowed"
            }

        # --------------------------------------------------
        # LLM-ONLY (motivation / casual coaching)
        # --------------------------------------------------
        if intent == Intent.LLM_ONLY:
            return {
                "answer": (
                    "Alright. You showed up — that already counts. "
                    "What’s one small win you’re going for today?"
                ),
                "_intent": "llm_only",
                "_trust_state": "allowed"
            }

        # --------------------------------------------------
        # RAG QUESTIONS (facts, workouts, diets)
        # --------------------------------------------------
        chunks = self.retriever.retrieve(query)

        if not chunks:
            return safe_fallback("no_evidence")

        synthesis = build_answer(query, chunks)
        confidence = synthesis.get("_confidence", 0.0)

        # --------------------------------------------------
        # MEDICAL SAFETY HARD BLOCK
        # --------------------------------------------------
        if any(x in ql for x in ("cancer", "cure", "disease")) and confidence < 0.8:
            return safe_fallback("medical_safety")

        response = {
            "type": synthesis.get("type"),
            "summary": synthesis.get("summary"),
            "data": synthesis.get("data"),
            "saveable": True,
            "confidence": confidence,
            "sources": synthesis.get("sources", []),
            "_intent": "rag_question",
            "_trust_state": "allowed"
        }

        # --------------------------------------------------
        # PRESENTATION LAYER (Step 6B)
        # --------------------------------------------------
        response = build_presentation(response)

        # --------------------------------------------------
        # FINAL TRUST GATE
        # --------------------------------------------------
        return trust_gate(response)
