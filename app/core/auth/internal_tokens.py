from fastapi import APIRouter
from app.core.auth.service_token_manager import generate_service_token
from app.core.auth.service_account_loader import list_services

router = APIRouter(prefix="/internal/tokens", tags=["Internal Tokens"])


@router.get("/services")
async def get_services():
    """
    Returns all available internal services for reference.
    """
    return {"services": list_services()}


@router.get("/generate/{service_name}")
async def generate_token_for(service_name: str):
    """
    Generates a short-lived JWT for internal service testing.
    DO NOT expose this in production.
    """
    try:
        token = generate_service_token(service_name)
        return {"service": service_name, "token": token}
    except Exception as e:
        return {"error": str(e)}
