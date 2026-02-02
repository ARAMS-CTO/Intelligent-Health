
import logging
from logging.handlers import TimedRotatingFileHandler
import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import SystemLog
from ..database import SessionLocal

# Ensure logs directory exists
LOG_DIR = "logs"
try:
    os.makedirs(LOG_DIR, exist_ok=True)
except OSError:
    LOG_DIR = "/tmp/logs"
    os.makedirs(LOG_DIR, exist_ok=True)

class LoggerService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LoggerService, cls).__new__(cls)
            cls._instance.setup_logger()
        return cls._instance

    def setup_logger(self):
        self.logger = logging.getLogger("IntelligentHealthLogger")
        self.logger.setLevel(logging.INFO)
        
        # Prevent adding handlers multiple times
        if not self.logger.handlers:
            # File Handler - Rotate Daily
            # Note: In Cloud Run, this is ephemeral, but meets the requirement for "daily filed in log folder" in a local/VM context
            file_handler = TimedRotatingFileHandler(
                os.path.join(LOG_DIR, "system.log"),
                when="midnight",
                interval=1,
                backupCount=30
            )
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
            
            # Console Handler (for Cloud Logging)
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)

    def log(self, event_type: str, user_id: str = None, details: dict = None, level: str = "INFO"):
        """
        Logs to both File (System/Cloud) and Database (for Admin UI Persistence)
        """
        timestamp = datetime.utcnow()
        log_message = f"[{event_type}] User: {user_id} - Details: {json.dumps(details)}"
        
        # 1. Log to File/Console
        if level.upper() == "ERROR":
            self.logger.error(log_message)
        elif level.upper() == "WARNING":
            self.logger.warning(log_message)
        else:
            self.logger.info(log_message)

        # 2. Log to Database
        # Use a new session to ensure this log is committed independently of the caller's transaction state
        db: Session = SessionLocal()
        try:
            db_log = SystemLog(
                event_type=event_type,
                user_id=user_id,
                details=details or {},
                timestamp=timestamp
            )
            db.add(db_log)
            db.commit()
        except Exception as e:
            self.logger.error(f"Failed to write log to DB: {e}")
            db.rollback()
        finally:
            db.close()

logger = LoggerService()
