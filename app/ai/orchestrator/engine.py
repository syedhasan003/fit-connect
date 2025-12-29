from app.ai.agents.agent_registry import AgentRegistry
from app.ai.orchestrator.agent_router import AgentRouter
from app.ai.central_rag_orchestrator import answer_with_rag_and_trust


def safe(value):
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

        # -----------------------------
        # NO AGENT FALLBACK
        # -----------------------------
        if agent is None:
            return {
                "structured_output": {
                    "title": "Let’s try that again.",
                    "summary": "I couldn’t match your request to the right expert.",
                    "suggestions": [
                        "Try asking about workouts, diet, habits, or recovery."
                    ],
                    "next_steps": "Tell me your goal and I’ll guide you."
                }
            }

        # -----------------------------
        # AGENT RESPONSE (INTENT OWNER)
        # -----------------------------
        raw = await agent.respond(message)

        if not isinstance(raw, dict):
            raw = {
                "title": "Let’s try that again.",
                "summary": "There was an issue processing that request.",
                "suggestions": ["Try rephrasing your question."],
                "next_steps": "What would you like to achieve?"
            }

        # -----------------------------
        # ATTACH METADATA (SAFE)
        # -----------------------------
        raw.update({
            "_agent": agent_name,
            "_short_history_used": safe(short_history),
            "_profile_used": safe(profile),
            "_memory_used": safe(memory),
            "_goals_used": safe(goals),
        })

        # -----------------------------
        # RAG = EVIDENCE ONLY (NO INTENT)
        # -----------------------------
        rag = answer_with_rag_and_trust(message)

        if isinstance(rag, dict):
            # ⚠️ DO NOT TOUCH SUMMARY
            # Agent owns intent & wording

            # Inject evidence ONLY if agent didn't supply it
            if rag.get("data") and not raw.get("data"):
                raw["data"] = rag["data"]

            raw["sources"] = rag.get("sources", [])
            raw["_trust_state"] = rag.get("_trust_state")
            raw["_intent"] = rag.get("_intent")

        return {"structured_output": raw}
