from fastapi import APIRouter

router = APIRouter(
    prefix="/ai/plan",
    tags=["AI Plan"]
)

@router.get("/status")
async def plan_status():
    """
    Status endpoint for plan generation module.
    """
    return {"status": "AI plan endpoint active"}
