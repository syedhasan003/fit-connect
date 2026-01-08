from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Lifecycle Manager")

class StartAgentRequest(BaseModel):
    agent_name: str

class StopAgentRequest(BaseModel):
    agent_name: str

running_agents = {}


@app.post("/agent/start")
async def start_agent(req: StartAgentRequest):
    running_agents[req.agent_name] = {"status": "running"}
    return {
        "status": "started",
        "agent": req.agent_name
    }


@app.post("/agent/stop")
async def stop_agent(req: StopAgentRequest):
    running_agents.pop(req.agent_name, None)
    return {
        "status": "stopped",
        "agent": req.agent_name
    }


@app.get("/status")
async def get_status():
    return {
        "status": "ok",
        "message": "Lifecycle Manager operational",
        "running_agents": running_agents
    }
