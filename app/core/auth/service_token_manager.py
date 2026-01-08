from typing import Optional

from app.core.auth.jwt import create_service_token
from app.core.auth.service_account_loader import (
    get_scopes_for,
    service_exists,
)


def generate_service_token(service_name: str, expires_in: int = 600) -> str:
    """
    Generates a service-to-service JWT token with the scopes defined
    in service_accounts.yaml.
    """
    if not service_exists(service_name):
        raise ValueError(f"Service account '{service_name}' not found.")

    scopes = get_scopes_for(service_name)

    token = create_service_token(
        service_name=service_name,
        scopes=scopes,
        expires_in=expires_in
    )

    return token


def debug_list_service_tokens() -> dict:
    """
    Helper method: generate short-lived tokens for all services.
    Useful for local testing.
    """
    from app.core.auth.service_account_loader import list_services

    result = {}
    for service in list_services():
        try:
            result[service] = generate_service_token(service, expires_in=300)
        except Exception as e:
            result[service] = f"error: {e}"

    return result
