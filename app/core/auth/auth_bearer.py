from typing import Optional, Callable

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth.jwt import decode_token, JWTError, token_has_scope

class AuthBearer(HTTPBearer):
    """
    HTTPBearer that decodes JWT and returns decoded claims.
    """
    async def __call__(self, request: Request) -> dict:
        creds: HTTPAuthorizationCredentials = await super().__call__(request)
        token = creds.credentials
        try:
            claims = decode_token(token, verify_exp=True)
            return claims
        except JWTError as e:
            raise HTTPException(status_code=401, detail=str(e))
        except Exception:
            raise HTTPException(status_code=401, detail="invalid_auth_token")


def require_scope(required_scope: Optional[str] = None) -> Callable:
    """
    Dependency to enforce scope-based access.
    """
    auth = AuthBearer()

    async def _dependency(claims=Depends(auth)):
        if required_scope:
            if not token_has_scope(claims, required_scope):
                raise HTTPException(status_code=403, detail="insufficient_scope")
        return claims

    return _dependency
