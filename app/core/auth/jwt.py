import os
import time
from typing import Dict, List, Optional

import jwt


# NOTE:
# In production, FITCONNECT_JWT_SECRET should come from environment variables
SECRET = os.getenv("FITCONNECT_JWT_SECRET", "dev-secret-change-this")
ALGORITHM = "HS256"
DEFAULT_EXP_SECONDS = 60 * 10  # 10 minutes token lifetime


class JWTError(Exception):
    pass


def create_token(claims: Dict, expires_in: int = DEFAULT_EXP_SECONDS) -> str:
    """
    Creates a signed JWT with provided claims.
    """
    now = int(time.time())

    payload = {
        **claims,
        "iat": now,
        "exp": now + expires_in
    }

    token = jwt.encode(payload, SECRET, algorithm=ALGORITHM)

    if isinstance(token, bytes):
        token = token.decode()

    return token


def decode_token(token: str, verify_exp: bool = True) -> Dict:
    """
    Decodes a JWT and validates its signature & expiration.
    Throws JWTError on failure.
    """
    try:
        return jwt.decode(
            token,
            SECRET,
            algorithms=[ALGORITHM],
            options={"verify_exp": verify_exp}
        )
    except jwt.ExpiredSignatureError as e:
        raise JWTError("Token expired") from e
    except jwt.PyJWTError as e:
        raise JWTError("Invalid token") from e


def create_service_token(
    service_name: str,
    scopes: Optional[List[str]] = None,
    expires_in: int = DEFAULT_EXP_SECONDS
) -> str:
    """
    Generates short-lived service-to-service tokens.
    Mirrors the architecture from the Gym Discovery backend.
    """
    return create_token({
        "sub": f"service:{service_name}",
        "scopes": scopes or []
    }, expires_in)


def token_has_scope(claims: Dict, required_scope: str) -> bool:
    """
    Returns True if decoded JWT contains the required permission scope.
    """
    scopes = claims.get("scopes", [])
    return isinstance(scopes, list) and required_scope in scopes


def get_subject(claims: Dict) -> Optional[str]:
    """
    Extract user/service subject identifier.
    """
    return claims.get("sub")
