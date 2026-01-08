from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.auth.jwt import decode_token


def create_error_handler(app):
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail},
        )


class ServiceAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces internal service token authentication.
    Allows open access to documentation routes.
    """

    async def dispatch(self, request: Request, call_next):
        # Allow docs & schema to load WITHOUT auth
        open_paths = [
            "/docs",
            "/openapi.json",
            "/redoc",
            "/favicon.ico",
            "/internal/tokens",  # allow token generation routes
        ]

        # Skip auth for allowed paths
        if any(request.url.path.startswith(p) for p in open_paths):
            return await call_next(request)

        # All other routes → require Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Missing or invalid authorization header"
            )

        token = auth_header.split(" ", 1)[1]

        # Decode token using our JWT utils
        try:
            payload = decode_token(token)
            request.state.service = payload  # attach service identity to request
        except Exception:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )

        return await call_next(request)
