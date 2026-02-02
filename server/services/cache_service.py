"""
Caching Service for Intelligent Health Platform

Provides in-memory caching with TTL support for API responses,
database query results, and frequently accessed data.
"""

from datetime import datetime, timedelta
from typing import Any, Optional, Callable, TypeVar
from functools import wraps
import asyncio
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class CacheEntry:
    """Represents a cached item with expiration."""
    
    def __init__(self, value: Any, ttl_seconds: int):
        self.value = value
        self.expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        self.created_at = datetime.utcnow()
        self.hits = 0
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def get(self) -> Any:
        self.hits += 1
        return self.value


class MemoryCache:
    """
    Thread-safe in-memory cache with TTL support.
    
    For production, this can be replaced with Redis client
    while maintaining the same interface.
    """
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self._cache: dict[str, CacheEntry] = {}
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._lock = asyncio.Lock()
        self._stats = {"hits": 0, "misses": 0, "evictions": 0}
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        async with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                self._stats["misses"] += 1
                return None
            
            if entry.is_expired():
                del self._cache[key]
                self._stats["misses"] += 1
                return None
            
            self._stats["hits"] += 1
            return entry.get()
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in cache with optional TTL."""
        async with self._lock:
            # Evict oldest entries if at capacity
            if len(self._cache) >= self._max_size:
                await self._evict_oldest()
            
            self._cache[key] = CacheEntry(value, ttl or self._default_ttl)
    
    async def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    async def clear(self) -> None:
        """Clear all cached items."""
        async with self._lock:
            self._cache.clear()
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern."""
        async with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_delete:
                del self._cache[key]
            return len(keys_to_delete)
    
    async def _evict_oldest(self) -> None:
        """Evict oldest entries to make room."""
        if not self._cache:
            return
        
        # Remove expired entries first
        expired = [k for k, v in self._cache.items() if v.is_expired()]
        for key in expired:
            del self._cache[key]
            self._stats["evictions"] += 1
        
        # If still at capacity, remove oldest
        if len(self._cache) >= self._max_size:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k].created_at)
            del self._cache[oldest_key]
            self._stats["evictions"] += 1
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
        
        return {
            **self._stats,
            "size": len(self._cache),
            "max_size": self._max_size,
            "hit_rate": f"{hit_rate:.1f}%"
        }


# Global cache instance
cache = MemoryCache(max_size=2000, default_ttl=300)


def cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments."""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(ttl: int = 300, prefix: str = ""):
    """
    Decorator for caching async function results.
    
    Usage:
        @cached(ttl=60, prefix="user")
        async def get_user(user_id: str):
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Generate cache key
            key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = await cache.get(key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator


def cached_sync(ttl: int = 300, prefix: str = ""):
    """
    Decorator for caching sync function results.
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        _cache: dict[str, CacheEntry] = {}
        
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            entry = _cache.get(key)
            if entry and not entry.is_expired():
                return entry.get()
            
            result = func(*args, **kwargs)
            _cache[key] = CacheEntry(result, ttl)
            return result
        
        return wrapper
    return decorator


# Cache invalidation helpers
async def invalidate_user_cache(user_id: str) -> int:
    """Invalidate all cached data for a user."""
    return await cache.clear_pattern(f"user:{user_id}")


async def invalidate_patient_cache(patient_id: str) -> int:
    """Invalidate all cached data for a patient."""
    return await cache.clear_pattern(f"patient:{patient_id}")


async def invalidate_case_cache(case_id: str) -> int:
    """Invalidate all cached data for a case."""
    return await cache.clear_pattern(f"case:{case_id}")
