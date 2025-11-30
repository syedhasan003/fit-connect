from .auth import router as auth
from .health import router as health
from .progress import router as progress
from .gym import router as gym

__all__ = ["auth", "health", "progress", "gym"]
