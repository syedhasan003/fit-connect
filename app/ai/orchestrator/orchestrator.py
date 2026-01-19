from fastapi import FastAPI, HTTPException, Depends
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.ai.agent_registry import AgentRegistry
from app.ai.orchestrator.collaboration_manager import CollaborationManager
from app.ai.orchestrator.state_manager import state_manager
from app.ai.orchestrator.central_agent import CentralAgent
from app.ai.orchestrator.reflection_engine import ReflectionEngine

from app.ai.memory.context_builder import ContextBuilder

from app.ai.agents.coach_agent import CoachAgent
from app.ai.agents.dietician_agent import DieticianAgent

from app.deps import get_current_user
from app.models.user import User

# -------------------------------------------------
# App
# -------------------------------------------------
app = FastAPI(title="FitNova Orchestrator")

# -------------------------------------------------
# OpenAPI
# -------------------------------------------------
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title="FitNova Orchestrator",
        version="1.0.0",
        description="Agent Orchestration API",
        routes=app.routes,
    )

    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "Authorization",
        }
    }

    for p in schema.get("paths", {}).values():
        for m in p.values():
            m.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi

# -------------------------------------------------
# Models
# -------------------------------------------------
class OrchestrateRequest(BaseModel):
    goal: str

# -------------------------------------------------
# Registry
# -------------------------------------------------
registry = AgentRegistry()
collab_manager = CollaborationManager(registry, state_manager)
central_agent = CentralAgent(registry, collab_manager)

registry.register("central", central_agent)
registry.register("coach", CoachAgent())
registry.register("dietician", DieticianAgent())

# -------------------------------------------------
# Health
# -------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}

# -------------------------------------------------
# MAIN ENDPOINT
# -------------------------------------------------
@app.post("/orchestrate")
async def orchestrate(
    req: OrchestrateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = ContextBuilder.build(
        user_id=current_user.id,
        db=db,
    )

    payload = {
        "type": "orchestrate",
        "input": {"goal_text": req.goal},
        "context": context,
    }

    result = await central_agent.handle(payload)
    final = result.get("final")

    if not final:
        raise HTTPException(500, "No final decision")

    decisions = final.get("decisions", [])
    if not decisions:
        raise HTTPException(500, "No valid decisions")

    # -------------------------------------------------
    # 🔁 PHASE 4: REFLECTION LOOP (BEHAVIORAL ONLY)
    # -------------------------------------------------
    ReflectionEngine.reflect(
        user_id=current_user.id,
        intent=final.get("intent"),
        decisions=decisions,
        db=db,
    )

    primary = decisions[0]["result"]

    # -------------------------------------------------
    # ✅ FRONTEND RESPONSE (INTELLIGENCE EXPOSED)
    # -------------------------------------------------
    return {
        "status": "ok",
        "goal": req.goal,
        "answer": primary,
        "meta": {
            "intent": final.get("intent"),
            "constraints": final.get("constraints", {}),
            "preferences": final.get("preferences", {}),
        }
    }
