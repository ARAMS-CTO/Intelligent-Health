"""
Rate Limiting Middleware for Intelligent Health API

Implements token bucket algorithm with per-IP rate limiting
to protect against abuse and DDoS attacks.
"""

from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import time
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """Token bucket rate limiter with per-IP tracking."""
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_allowance: int = 10
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_allowance = burst_allowance
        
        # Track requests per IP: {ip: [(timestamp, count), ...]}
        self.minute_buckets: Dict[str, list] = defaultdict(list)
        self.hour_buckets: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    def _cleanup_old_requests(self, bucket: list, window_seconds: int) -> list:
        """Remove requests older than the window."""
        cutoff = time.time() - window_seconds
        return [ts for ts in bucket if ts > cutoff]
    
    async def check_rate_limit(self, client_ip: str) -> Tuple[bool, Dict[str, int]]:
        """
        Check if the request should be rate limited.
        
        Returns:
            Tuple of (is_allowed, rate_limit_info)
        """
        async with self.lock:
            now = time.time()
            
            # Clean up old entries
            self.minute_buckets[client_ip] = self._cleanup_old_requests(
                self.minute_buckets[client_ip], 60
            )
            self.hour_buckets[client_ip] = self._cleanup_old_requests(
                self.hour_buckets[client_ip], 3600
            )
            
            minute_count = len(self.minute_buckets[client_ip])
            hour_count = len(self.hour_buckets[client_ip])
            
            # Calculate remaining requests
            minute_remaining = max(0, self.requests_per_minute - minute_count)
            hour_remaining = max(0, self.requests_per_hour - hour_count)
            
            rate_info = {
                "X-RateLimit-Limit-Minute": self.requests_per_minute,
                "X-RateLimit-Remaining-Minute": minute_remaining,
                "X-RateLimit-Limit-Hour": self.requests_per_hour,
                "X-RateLimit-Remaining-Hour": hour_remaining,
            }
            
            # Check if over limit (with burst allowance for minute limit)
            if minute_count >= self.requests_per_minute + self.burst_allowance:
                rate_info["X-RateLimit-Reset"] = int(
                    self.minute_buckets[client_ip][0] + 60 - now
                ) if self.minute_buckets[client_ip] else 60
                return False, rate_info
            
            if hour_count >= self.requests_per_hour:
                rate_info["X-RateLimit-Reset"] = int(
                    self.hour_buckets[client_ip][0] + 3600 - now
                ) if self.hour_buckets[client_ip] else 3600
                return False, rate_info
            
            # Record this request
            self.minute_buckets[client_ip].append(now)
            self.hour_buckets[client_ip].append(now)
            
            return True, rate_info


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting."""
    
    # Paths that should be exempt from rate limiting
    EXEMPT_PATHS = {
        "/health",
        "/docs",
        "/redoc", 
        "/openapi.json",
        "/favicon.ico",
    }
    
    # Paths with stricter limits (auth endpoints)
    STRICT_PATHS = {
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
    }
    
    def __init__(self, app, rate_limiter: RateLimiter = None):
        super().__init__(app)
        self.rate_limiter = rate_limiter or RateLimiter()
        self.strict_limiter = RateLimiter(
            requests_per_minute=10,
            requests_per_hour=50,
            burst_allowance=2
        )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, respecting X-Forwarded-For header."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Skip rate limiting for exempt paths
        if path in self.EXEMPT_PATHS or path.startswith("/assets") or path.startswith("/uploads"):
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        
        # Use stricter limiter for auth endpoints
        limiter = self.strict_limiter if path in self.STRICT_PATHS else self.rate_limiter
        
        is_allowed, rate_info = await limiter.check_rate_limit(client_ip)
        
        if not is_allowed:
            return Response(
                content='{"detail": "Rate limit exceeded. Please try again later."}',
                status_code=429,
                media_type="application/json",
                headers={k: str(v) for k, v in rate_info.items()}
            )
        
        # Process request and add rate limit headers to response
        response = await call_next(request)
        
        for key, value in rate_info.items():
            response.headers[key] = str(value)
        
        return response


# Export default rate limiter instance
default_rate_limiter = RateLimiter(
    requests_per_minute=100,
    requests_per_hour=2000,
    burst_allowance=20
)
