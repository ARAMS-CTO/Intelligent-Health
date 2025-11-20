from .auth import router as auth_router
from .cases import router as cases_router
from .patients import router as patients_router
from .ai import router as ai_router
from .comments import router as comments_router

__all__ = ["auth_router", "cases_router", "patients_router", "ai_router", "comments_router"]
