from fastapi import Request, HTTPException
from typing import List, Callable
from starlette.middleware.base import BaseHTTPMiddleware
from ..routes.auth import verify_token_data

class RBACMiddleware(BaseHTTPMiddleware):
    """
    Role-Based Access Control Middleware.
    Enforces role permissions on specific paths.
    """
    
    def __init__(self, app, role_map: dict):
        super().__init__(app)
        self.role_map = role_map # Dict[path_prefix, List[allowed_roles]]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Check if path needs protection
        required_roles = None
        for prefix, roles in self.role_map.items():
            if path.startswith(prefix):
                required_roles = roles
                break
        
        if required_roles:
            # Verify Auth
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                # If roles are required, we MUST have auth. 
                # Blocking unauthenticated access to protected routes.
                return await self._error_response("Authentication Required", status=401)
            else:
                try:
                    scheme, token = auth_header.split()
                    if scheme.lower() == 'bearer':
                        payload = verify_token_data(token)
                        user_role = payload.get("role")
                        # Case insensitive role check if needed, but assuming exact match
                        if user_role not in required_roles:
                             return await self._error_response("Insufficient Permissions for this resource")
                except Exception:
                    # Invalid tokens could be 401
                    return await self._error_response("Invalid Credentials", status=401)

        return await call_next(request)

    async def _error_response(self, msg: str, status: int = 403):
         from fastapi.responses import JSONResponse
         return JSONResponse(status_code=status, content={"detail": msg})
