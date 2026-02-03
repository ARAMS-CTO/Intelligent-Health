from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.datastructures import MutableHeaders

class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                
                # Google Sign-In compatibility
                headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
                headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

                # CSP
                csp_directives = [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai data:",
                    "img-src 'self' data: blob: https: http:",
                    "connect-src 'self' https://accounts.google.com https://apis.google.com https://*.googleapis.com wss: ws:",
                    "frame-src 'self' https://accounts.google.com",
                    "frame-ancestors 'self'",
                    "form-action 'self'",
                    "base-uri 'self'",
                    "upgrade-insecure-requests" # Added for HTTPS enforcement
                ]
                headers["Content-Security-Policy"] = "; ".join(csp_directives)

                # Additional
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "SAMEORIGIN"
                headers["X-XSS-Protection"] = "1; mode=block"
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"

                # Cache Control logic
                path = scope.get("path", "")
                if path.endswith("service-worker.js"):
                     headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
                elif path.endswith("index.html") or path == "/":
                     headers["Cache-Control"] = "no-cache, must-revalidate"

            await send(message)

        await self.app(scope, receive, send_wrapper)
