"""
Security Service for Intelligent Health Platform

Provides account lockout, token blacklisting, and security utilities.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Set
from sqlalchemy.orm import Session
import hashlib
import asyncio
import logging

logger = logging.getLogger(__name__)


class AccountLockoutService:
    """
    Manages account lockout after failed login attempts.
    
    Features:
    - Tracks failed attempts per user
    - Locks account after threshold
    - Auto-unlock after cooldown period
    """
    
    def __init__(
        self,
        max_attempts: int = 5,
        lockout_duration_minutes: int = 15,
        attempt_window_minutes: int = 30
    ):
        self.max_attempts = max_attempts
        self.lockout_duration = timedelta(minutes=lockout_duration_minutes)
        self.attempt_window = timedelta(minutes=attempt_window_minutes)
        
        # In-memory tracking (use Redis in production for multi-instance)
        self._failed_attempts: Dict[str, list] = {}  # {email: [timestamps]}
        self._locked_accounts: Dict[str, datetime] = {}  # {email: unlock_time}
        self._lock = asyncio.Lock()
    
    async def record_failed_attempt(self, email: str) -> Dict:
        """
        Record a failed login attempt.
        
        Returns dict with:
        - locked: bool
        - remaining_attempts: int
        - unlock_time: datetime (if locked)
        """
        async with self._lock:
            now = datetime.utcnow()
            email_lower = email.lower()
            
            # Check if already locked
            if email_lower in self._locked_accounts:
                unlock_time = self._locked_accounts[email_lower]
                if now < unlock_time:
                    logger.warning(f"Login attempt on locked account: {email_lower}")
                    return {
                        "locked": True,
                        "remaining_attempts": 0,
                        "unlock_time": unlock_time,
                        "message": f"Account locked until {unlock_time.isoformat()}"
                    }
                else:
                    # Unlock expired, remove from locked list
                    del self._locked_accounts[email_lower]
                    self._failed_attempts.pop(email_lower, None)
            
            # Add this attempt
            if email_lower not in self._failed_attempts:
                self._failed_attempts[email_lower] = []
            
            self._failed_attempts[email_lower].append(now)
            
            # Clean old attempts outside the window
            cutoff = now - self.attempt_window
            self._failed_attempts[email_lower] = [
                ts for ts in self._failed_attempts[email_lower] if ts > cutoff
            ]
            
            attempts = len(self._failed_attempts[email_lower])
            remaining = max(0, self.max_attempts - attempts)
            
            # Check if we should lock
            if attempts >= self.max_attempts:
                unlock_time = now + self.lockout_duration
                self._locked_accounts[email_lower] = unlock_time
                logger.warning(f"Account locked due to failed attempts: {email_lower}")
                return {
                    "locked": True,
                    "remaining_attempts": 0,
                    "unlock_time": unlock_time,
                    "message": f"Account locked for {self.lockout_duration.seconds // 60} minutes"
                }
            
            return {
                "locked": False,
                "remaining_attempts": remaining,
                "message": f"{remaining} attempts remaining"
            }
    
    async def record_successful_login(self, email: str):
        """Clear failed attempts on successful login."""
        async with self._lock:
            email_lower = email.lower()
            self._failed_attempts.pop(email_lower, None)
            self._locked_accounts.pop(email_lower, None)
    
    async def is_locked(self, email: str) -> bool:
        """Check if an account is currently locked."""
        async with self._lock:
            email_lower = email.lower()
            if email_lower not in self._locked_accounts:
                return False
            
            now = datetime.utcnow()
            unlock_time = self._locked_accounts[email_lower]
            
            if now >= unlock_time:
                del self._locked_accounts[email_lower]
                self._failed_attempts.pop(email_lower, None)
                return False
            
            return True
    
    async def unlock_account(self, email: str):
        """Manually unlock an account (admin action)."""
        async with self._lock:
            email_lower = email.lower()
            self._locked_accounts.pop(email_lower, None)
            self._failed_attempts.pop(email_lower, None)
            logger.info(f"Account manually unlocked: {email_lower}")


class TokenBlacklistService:
    """
    Manages JWT token blacklisting for logout and revocation.
    
    Features:
    - Blacklist tokens on logout
    - Check if token is blacklisted
    - Auto-cleanup of expired blacklist entries
    """
    
    def __init__(self):
        # In-memory storage (use Redis in production)
        self._blacklist: Dict[str, datetime] = {}  # {token_hash: expiry_time}
        self._lock = asyncio.Lock()
    
    def _hash_token(self, token: str) -> str:
        """Hash token for storage (don't store full tokens)."""
        return hashlib.sha256(token.encode()).hexdigest()[:32]
    
    async def blacklist_token(self, token: str, expires_at: datetime):
        """Add a token to the blacklist."""
        async with self._lock:
            token_hash = self._hash_token(token)
            self._blacklist[token_hash] = expires_at
            logger.info(f"Token blacklisted: {token_hash[:8]}...")
            
            # Cleanup expired entries occasionally
            await self._cleanup_expired()
    
    async def is_blacklisted(self, token: str) -> bool:
        """Check if a token is blacklisted."""
        async with self._lock:
            token_hash = self._hash_token(token)
            
            if token_hash not in self._blacklist:
                return False
            
            # Check if the blacklist entry itself has expired
            expiry = self._blacklist[token_hash]
            if datetime.utcnow() > expiry:
                del self._blacklist[token_hash]
                return False
            
            return True
    
    async def _cleanup_expired(self):
        """Remove expired entries from blacklist."""
        now = datetime.utcnow()
        expired = [k for k, v in self._blacklist.items() if v < now]
        for key in expired:
            del self._blacklist[key]
    
    async def revoke_all_user_tokens(self, user_id: str, current_token_exp: datetime):
        """
        Revoke all tokens for a user (e.g., password change).
        
        In a production system, this would invalidate a user-specific version
        stored in the database. For now, we rely on short token expiry.
        """
        logger.info(f"All tokens revoked for user: {user_id}")
        # In production: increment a token_version field in the User table


class SecurityAuditLogger:
    """Logs security-relevant events for monitoring."""
    
    @staticmethod
    def log_login_attempt(email: str, success: bool, ip_address: str, reason: str = None):
        """Log a login attempt."""
        status = "SUCCESS" if success else "FAILED"
        msg = f"[LOGIN {status}] email={email} ip={ip_address}"
        if reason:
            msg += f" reason={reason}"
        
        if success:
            logger.info(msg)
        else:
            logger.warning(msg)
    
    @staticmethod
    def log_password_change(user_id: str, ip_address: str):
        """Log password change."""
        logger.info(f"[PASSWORD_CHANGE] user_id={user_id} ip={ip_address}")
    
    @staticmethod
    def log_token_revocation(user_id: str, reason: str):
        """Log token revocation."""
        logger.info(f"[TOKEN_REVOKED] user_id={user_id} reason={reason}")
    
    @staticmethod
    def log_suspicious_activity(user_id: str, activity: str, details: str):
        """Log suspicious activity for review."""
        logger.warning(f"[SUSPICIOUS] user_id={user_id} activity={activity} details={details}")


# Global instances
account_lockout = AccountLockoutService(
    max_attempts=5,
    lockout_duration_minutes=15,
    attempt_window_minutes=30
)

token_blacklist = TokenBlacklistService()
security_logger = SecurityAuditLogger()
