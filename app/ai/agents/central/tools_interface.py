import httpx
from typing import Any, Dict, Optional


class ToolsInterface:
    """
    Wrapper for calling external APIs/tools.
    Keeps the Central agent clean.
    """

    async def call_http(
        self,
        url: str,
        method: str = "GET",
        json: Optional[Dict] = None,
        headers: Optional[Dict] = None,
    ):
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.request(method, url, json=json, headers=headers)

            # Try returning JSON first, fallback to text
            try:
                return response.json()
            except Exception:
                return {
                    "status_code": response.status_code,
                    "text": response.text,
                }
