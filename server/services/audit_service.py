"""
Audit Logging Service for Intelligent Health Platform

Provides comprehensive audit logging for security, compliance (HIPAA, GDPR),
and system monitoring purposes.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum
import json
import logging

logger = logging.getLogger(__name__)


class AuditEventType(str, Enum):
    """Types of audit events."""
    # Authentication
    AUTH_LOGIN = "auth.login"
    AUTH_LOGOUT = "auth.logout"
    AUTH_FAILED = "auth.failed"
    AUTH_PASSWORD_CHANGE = "auth.password_change"
    AUTH_TOKEN_REFRESH = "auth.token_refresh"
    
    # User Management
    USER_CREATE = "user.create"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_ROLE_CHANGE = "user.role_change"
    
    # Patient Data Access
    PATIENT_VIEW = "patient.view"
    PATIENT_CREATE = "patient.create"
    PATIENT_UPDATE = "patient.update"
    PATIENT_DELETE = "patient.delete"
    PATIENT_EXPORT = "patient.export"
    
    # Medical Records
    RECORD_VIEW = "record.view"
    RECORD_CREATE = "record.create"
    RECORD_UPDATE = "record.update"
    RECORD_DELETE = "record.delete"
    RECORD_DOWNLOAD = "record.download"
    RECORD_SHARE = "record.share"
    
    # Cases
    CASE_VIEW = "case.view"
    CASE_CREATE = "case.create"
    CASE_UPDATE = "case.update"
    CASE_STATUS_CHANGE = "case.status_change"
    CASE_ASSIGN = "case.assign"
    
    # AI Operations
    AI_ANALYSIS = "ai.analysis"
    AI_SUGGESTION = "ai.suggestion"
    AI_CHAT = "ai.chat"
    
    # Blockchain
    CONCORDIUM_CONNECT = "concordium.connect"
    CONCORDIUM_GRANT = "concordium.grant"
    CONCORDIUM_REVOKE = "concordium.revoke"
    CONCORDIUM_ZKP = "concordium.zkp"
    
    # Billing
    PAYMENT_INITIATED = "payment.initiated"
    PAYMENT_COMPLETED = "payment.completed"
    PAYMENT_FAILED = "payment.failed"
    
    # System
    SYSTEM_CONFIG_CHANGE = "system.config_change"
    SYSTEM_ERROR = "system.error"
    DATA_EXPORT = "data.export"
    DATA_IMPORT = "data.import"


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AuditLogService:
    """Service for recording and querying audit logs."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.INFO,
        success: bool = True
    ) -> str:
        """
        Record an audit log entry.
        
        Args:
            event_type: Type of event being logged
            user_id: ID of the user performing the action
            resource_type: Type of resource being accessed (e.g., 'patient', 'case')
            resource_id: ID of the specific resource
            details: Additional details about the event
            ip_address: Client IP address
            user_agent: Client user agent string
            severity: Severity level of the event
            success: Whether the operation was successful
            
        Returns:
            ID of the created audit log entry
        """
        try:
            from ..models import SystemLog
            import uuid
            
            log_entry = SystemLog(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                level=severity.value.upper(),
                source=event_type.value,
                message=self._format_message(event_type, resource_type, resource_id, success),
                user_id=user_id,
                details=json.dumps({
                    "event_type": event_type.value,
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "success": success,
                    "extra": details or {}
                })
            )
            
            self.db.add(log_entry)
            self.db.commit()
            
            # Also log to Python logger for monitoring
            log_msg = f"[AUDIT] {event_type.value} | User: {user_id} | Resource: {resource_type}:{resource_id} | Success: {success}"
            if severity == AuditSeverity.ERROR or severity == AuditSeverity.CRITICAL:
                logger.error(log_msg)
            elif severity == AuditSeverity.WARNING:
                logger.warning(log_msg)
            else:
                logger.info(log_msg)
            
            return log_entry.id
            
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            return ""
    
    def _format_message(
        self,
        event_type: AuditEventType,
        resource_type: Optional[str],
        resource_id: Optional[str],
        success: bool
    ) -> str:
        """Format a human-readable message for the audit event."""
        status = "succeeded" if success else "failed"
        
        messages = {
            AuditEventType.AUTH_LOGIN: f"User login {status}",
            AuditEventType.AUTH_LOGOUT: "User logged out",
            AuditEventType.AUTH_FAILED: "Authentication failed",
            AuditEventType.PATIENT_VIEW: f"Viewed patient record {resource_id}",
            AuditEventType.PATIENT_CREATE: f"Created new patient profile",
            AuditEventType.RECORD_VIEW: f"Accessed medical record {resource_id}",
            AuditEventType.RECORD_CREATE: f"Uploaded new medical record",
            AuditEventType.CASE_VIEW: f"Viewed case {resource_id}",
            AuditEventType.AI_ANALYSIS: f"AI analysis performed on {resource_type}",
            AuditEventType.CONCORDIUM_GRANT: f"Granted blockchain access to record {resource_id}",
        }
        
        return messages.get(event_type, f"{event_type.value} {status}")
    
    def get_logs(
        self,
        user_id: Optional[str] = None,
        event_types: Optional[list] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        severity: Optional[AuditSeverity] = None,
        limit: int = 100,
        offset: int = 0
    ) -> list:
        """
        Query audit logs with filters.
        
        Returns list of audit log entries matching the criteria.
        """
        from ..models import SystemLog
        
        query = self.db.query(SystemLog)
        
        if user_id:
            query = query.filter(SystemLog.user_id == user_id)
        
        if severity:
            query = query.filter(SystemLog.level == severity.value.upper())
        
        if start_date:
            query = query.filter(SystemLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(SystemLog.timestamp <= end_date)
        
        query = query.order_by(SystemLog.timestamp.desc())
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def get_user_activity(self, user_id: str, days: int = 30) -> list:
        """Get recent activity for a specific user."""
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        return self.get_logs(user_id=user_id, start_date=start_date)
    
    def get_patient_access_log(self, patient_id: str) -> list:
        """Get all access logs for a specific patient (HIPAA compliance)."""
        return self.get_logs(resource_type="patient", limit=1000)


# Convenience functions for common audit operations
def log_auth_event(
    db: Session,
    event_type: AuditEventType,
    user_id: str,
    ip_address: str,
    success: bool = True,
    details: Optional[Dict] = None
):
    """Log an authentication event."""
    service = AuditLogService(db)
    return service.log(
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        severity=AuditSeverity.INFO if success else AuditSeverity.WARNING,
        success=success,
        details=details
    )


def log_data_access(
    db: Session,
    user_id: str,
    resource_type: str,
    resource_id: str,
    action: str,
    ip_address: Optional[str] = None
):
    """Log a data access event (for HIPAA compliance)."""
    event_map = {
        "view": AuditEventType.PATIENT_VIEW if resource_type == "patient" else AuditEventType.RECORD_VIEW,
        "create": AuditEventType.PATIENT_CREATE if resource_type == "patient" else AuditEventType.RECORD_CREATE,
        "update": AuditEventType.PATIENT_UPDATE if resource_type == "patient" else AuditEventType.RECORD_UPDATE,
        "delete": AuditEventType.PATIENT_DELETE if resource_type == "patient" else AuditEventType.RECORD_DELETE,
    }
    
    service = AuditLogService(db)
    return service.log(
        event_type=event_map.get(action, AuditEventType.RECORD_VIEW),
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address
    )


def log_ai_operation(
    db: Session,
    user_id: str,
    operation: str,
    resource_type: str,
    resource_id: str,
    details: Optional[Dict] = None
):
    """Log an AI operation."""
    service = AuditLogService(db)
    return service.log(
        event_type=AuditEventType.AI_ANALYSIS,
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        details={"operation": operation, **(details or {})}
    )
