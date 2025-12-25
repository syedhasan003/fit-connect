from fastapi import APIRouter

router = APIRouter(
    prefix="/ai/metrics",
    tags=["AI Metrics"]
)

@router.get("/status")
async def metrics_status():
    """
    Status endpoint for metrics analysis.
    """
    return {"status": "AI metrics endpoint active"}
