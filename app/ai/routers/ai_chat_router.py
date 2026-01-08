from fastapi import APIRouter, Body
from app.ai.orchestrator.engine import OrchestratorEngine
from app.ai.memory.short_term import ShortTermMemory
from app.ai.memory.long_term import LongTermMemory

router = APIRouter(prefix="/ai/chat", tags=["AI Chat"])

engine = OrchestratorEngine()
short_memory = ShortTermMemory(window_size=10)
long_memory = LongTermMemory()

@router.post("/message")
async def chat_message(
    user_id: str = Body(...),
    message: str = Body(...)
):
    # Save user message
    short_memory.push(user_id, {"sender": "user", "message": message})
    history = short_memory.get(user_id)

    # Build profile
    profile = {
        "id": user_id,
        "goals": long_memory.read(user_id, "goals")
    }

    # Main orchestrator call
    output = await engine.handle(
        message=message,
        user_id=user_id,
        short_history=history,
        profile=profile
    )

    # Save AI response in memory
    short_memory.push(user_id, {
        "sender": "agent",
        "message": output["structured_output"]
    })

    return output
