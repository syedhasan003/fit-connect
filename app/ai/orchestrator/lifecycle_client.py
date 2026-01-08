import httpx
from typing import Optional, Dict, Any

from app.core.auth.service_token_manager import generate_service_token


class LifecycleManagerClient:
    """
    Handles secure communication with the Lifecycle Manager service.
    """

    def __init__(self, base_url: str = "http://127.0.0.1:8100"):
        self.base_url = base_url

        # Generate orchestrator service token
        self.token = generate_service_token("orchestrator")

        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def start_agent(self, agent_name: str) -> Dict[str, Any]:
        payload = {"agent_name": agent_name}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/agents/start",
                json=payload,
                headers=self.headers
            )
        return response.json()

    async def stop_agent(self, pid: int) -> Dict[str, Any]:
        payload = {"agent_name": "", "command": str(pid)}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/agents/stop",
                json=payload,
                headers=self.headers
            )
        return response.json()

    async def get_status(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/agents/status",
                headers=self.headers
            )
        return response.json()
