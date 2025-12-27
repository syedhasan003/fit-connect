from app.ai.agents.agent_registry import AgentRegistry
from app.ai.orchestrator.agent_router import AgentRouter

# 🔐 RAG + TRUST IMPORTS
from app.ai.central_rag_orchestrator import answer_with_rag_and_trust
from app.ai.trust.user_safe_responses import soften_response, redirect_response


def safe(value):
    """
    Ensures we only keep JSON-serializable, non-recursive data.
    """
    if isinstance(value, (str, int, float, bool, type(None))):
        return value
    if isinstance(value, list):
        return [safe(v) for v in value]
    if isinstance(value, dict):
        return {k: safe(v) for k, v in value.items()}
    return str(value)


class OrchestratorEngine:
    def __init__(self):
        self.registry = AgentRegistry()
        self.router = AgentRouter()

    async def handle(
        self,
        user_id: str,
        message: str,
        short_history=None,
        profile=None,
        memory=None,
        goals=None,
    ):

        agent_name = self.router.choose_agent(message)
        agent = self.registry.get_agent(agent_name)

        if agent is None:
            return {
                "structured_output": {
                    "title": "Let's try that again.",
                    "summary": "I couldn't match your request to the right expert.",
                    "suggestions": [
                        "Try asking about workouts, diet, habits, progress, or motivation."
                    ],
                    "next_steps": "Tell me your goals and I’ll guide you."
                }
            }

        raw = await agent.respond(message)

        if not isinstance(raw, dict):
            raw = {
                "title": "Let's try that again.",
                "summary": "There was an issue processing that request.",
                "suggestions": ["Try rephrasing your question."],
                "next_steps": "What would you like to achieve first?"
            }

        # -----------------------------
        # METADATA (SAFE)
        # -----------------------------
        metadata = {
            "_agent": agent_name,
            "_short_history_used": safe(short_history),
            "_profile_used": safe(profile),
            "_memory_used": safe(memory),
            "_goals_used": safe(goals),
        }

        raw.update(metadata)

        # -----------------------------
        # 🔐 RAG + TRUST FINAL PASS
        # -----------------------------
        user_text = message if isinstance(message, str) else str(message)

        rag_answer, gate = answer_with_rag_and_trust(
            user_query=user_text,
            topic="normal"  # later: auto-classifier (injury / medical)
        )

        if gate == "allow" and rag_answer.answer:
            raw["summary"] = rag_answer.answer

        elif gate == "soften" and rag_answer.answer:
            raw["summary"] = soften_response(rag_answer.answer)

        elif gate == "redirect":
            raw["summary"] = redirect_response()

        return {"structured_output": raw}
