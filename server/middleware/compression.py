"""
Response Compression Middleware for Intelligent Health Platform

Provides gzip/brotli compression for API responses to reduce bandwidth.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
import gzip
import io
from typing import Callable


class CompressionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to compress API responses using gzip.
    
    Only compresses responses:
    - Larger than min_size bytes
    - With compressible content types
    - When client accepts gzip encoding
    """
    
    COMPRESSIBLE_TYPES = {
        "application/json",
        "text/html",
        "text/plain",
        "text/css",
        "application/javascript",
        "text/javascript",
        "application/xml",
        "text/xml",
    }
    
    def __init__(self, app, min_size: int = 500, compression_level: int = 6):
        super().__init__(app)
        self.min_size = min_size
        self.compression_level = compression_level
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Check if client accepts gzip
        accept_encoding = request.headers.get("Accept-Encoding", "")
        supports_gzip = "gzip" in accept_encoding.lower()
        
        if not supports_gzip:
            return await call_next(request)
        
        response = await call_next(request)
        
        # Skip if already streaming or not a compressible type
        if isinstance(response, StreamingResponse):
            return response
        
        content_type = response.headers.get("Content-Type", "")
        base_type = content_type.split(";")[0].strip()
        
        if base_type not in self.COMPRESSIBLE_TYPES:
            return response
        
        # Skip small responses
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) < self.min_size:
            return response
        
        # Get response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        
        if len(body) < self.min_size:
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
        
        # Compress
        compressed = gzip.compress(body, compresslevel=self.compression_level)
        
        # Only use compression if it actually reduces size
        if len(compressed) >= len(body):
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
        
        # Return compressed response
        headers = dict(response.headers)
        headers["Content-Encoding"] = "gzip"
        headers["Content-Length"] = str(len(compressed))
        headers["Vary"] = "Accept-Encoding"
        
        return Response(
            content=compressed,
            status_code=response.status_code,
            headers=headers,
            media_type=response.media_type
        )
