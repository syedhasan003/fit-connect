from fastapi import FastAPI, HTTPException, Depends
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
import httpx
import os
import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# -------------------------------------------------
# Database
# -------------------------------------------------
from app.db.database import get_db

# -------------------------------------------------
# Agent Registry + Core Orchestrator Components
# -------------------------------------------------
from app.ai.agent_registry import AgentRegistry
from app.ai.orchestrator.collaboration_manager import CollaborationManager
from app.ai.orchestrator.state_manager import state_manager
from app.ai.orchestrator.central_agent import CentralAgent

# -------------------------------------------------
# Context + Memory
# -------------------------------------------------
from app.ai.memory.context_builder import ContextBuilder
from app.ai.memory.memory_writer import persist_health_memory

# -------------------------------------------------
# Worker agents
# -------------------------------------------------
from app.ai.agents.coach_agent import CoachAgent
from app.ai.agents.dietician_agent import DieticianAgent

# -------------------------------------------------
# Auth
# -------------------------------------------------
from app.deps import get_current_user
from app.models.user import User

# -----------------------
# Configuration
# -----------------------
INTERNAL_JWT_SECRET = os.environ.get("INTERNAL_JWT_SECRET", "dev-internal-secret")
INTERNAL_JWT_ALG = "HS256"
INTERNAL_TOKEN_TTL_SECONDS = int(os.environ.get("INTERNAL_TOKEN_TTL", "3600"))

app = FastAPI(title="FitNova Orchestrator")

# -------------------------------------------------
# OpenAPI override
# -------------------------------------------------
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="FitNova Orchestrator",
        version="1.0.0",
        description="Agent Orchestration API",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "Authorization",
        }
    }

    for path in openapi_schema.get("paths", {}).values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# -------------------------------------------------
# Models
# -------------------------------------------------
class OrchestrateRequest(BaseModel):
    goal: str


class AgentAction(BaseModel):
    agent_name: str
    pid: int | None = None

# -------------------------------------------------
# Lifecycle Client (optional)
# -------------------------------------------------
class LifecycleClient:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8100"

    async def start_agent(self, agent_name: str):
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/agent/start",
                json={"agent_name": agent_name},
            )
            return res.json()

    async def stop_agent(self, agent_name: str):
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/agent/stop",
                json={"agent_name": agent_name},
            )
            return res.json()

    async def lifecycle_status(self):
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(f"{self.base_url}/status")
                return res.json()
            except Exception:
                return {"status": "down"}


lifecycle_client = LifecycleClient()

# -------------------------------------------------
# Internal token generator (dev only)
# -------------------------------------------------
@app.get("/internal/tokens/generate/{service_name}")
async def generate_internal_token(service_name: str):
    now = datetime.utcnow()
    exp = now + timedelta(seconds=INTERNAL_TOKEN_TTL_SECONDS)
    payload = {
        "service": service_name,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, INTERNAL_JWT_SECRET, algorithm=INTERNAL_JWT_ALG)
    return {"service": service_name, "token": token}

# -------------------------------------------------
# Agent Registry Setup
# -------------------------------------------------
registry = AgentRegistry()

collab_manager = CollaborationManager(registry, state_manager)
central_agent = CentralAgent(registry, collab_manager)

registry.agents["central"] = central_agent
registry.agents["coach"] = CoachAgent()
registry.agents["dietician"] = DieticianAgent()

# -------------------------------------------------
# Health
# -------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "message": "Orchestrator operational"}

# -------------------------------------------------
# MAIN ORCHESTRATION ENDPOINT
# -------------------------------------------------
@app.post("/orchestrate")
async def orchestrate(
    req: OrchestrateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    central = registry.get_agent("central")
    if not central:
        raise HTTPException(500, "Central agent not registered")

    # -------------------------------------------------
    # Build REAL user context
    # -------------------------------------------------
    context = ContextBuilder.build(
        user_id=current_user.id,
        db=db,
    )

    payload = {
        "type": "orchestrate",
        "input": {
            "goal_text": req.goal,
        },
        "context": context,
    }

    result = await central.handle(payload)

    # -------------------------------------------------
    # AI MEMORY WRITE-BACK (LONG TERM)
    # -------------------------------------------------
    persist_health_memory(
        user_id=current_user.id,
        memory_type="ai_interaction",
        content={
            "goal": req.goal,
            "response": result,
        },
        db=db,
    )

    return result
