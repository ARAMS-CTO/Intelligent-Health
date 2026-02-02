from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from .config import settings
# import google.cloud.sql.connector # Moved inside get_engine
import logging

logger = logging.getLogger(__name__)
print("DEBUG: Loading database.py v0.2.0 - Optimized with Connection Pooling")

# --- DATABASE CONFIG ---
# DB settings are now loaded from server.config.Settings


def get_engine():
    """
    Create database engine with optimized settings.
    Auto-detects Cloud SQL Connector usage vs Standard TCP/Socket.
    """
    
    # 1. Cloud SQL via Python Connector (Best for Cloud Run)
    if settings.INSTANCE_CONNECTION_NAME:
        try:
            print(f"DEBUG: Initializing Cloud SQL Connector for {settings.INSTANCE_CONNECTION_NAME}")
            from google.cloud.sql.connector import Connector, IPTypes
            
            # Initialize Connector (must be global or kept alive)
            # For simplicity in this function scope, we create it here.
            # In high-load production, consider a global singleton for the connector.
            connector = Connector()
            
            def getconn():
                conn = connector.connect(
                    settings.INSTANCE_CONNECTION_NAME,
                    "pg8000",
                    user=settings.DB_USER,
                    password=settings.DB_PASS,
                    db=settings.DB_NAME,
                    ip_type=IPTypes.PUBLIC
                )
                return conn

            engine = create_engine(
                "postgresql+pg8000://",
                creator=getconn,
                poolclass=QueuePool,
                pool_size=10,
                max_overflow=20,
                pool_timeout=30,
                pool_recycle=1800,
                pool_pre_ping=True,
            )
            print("INFO: Database Engine: Cloud SQL Connector (PostgreSQL)")
            return engine
            
        except Exception as e:
            print(f"ERROR: Cloud SQL Connector failed: {e}")
            # Fallthrough to try other methods if possible
            
    # 2. Standard DATABASE_URL (e.g. "postgresql://user:pass@host:5432/db")
    db_url = settings.DATABASE_URL
    if db_url and db_url.startswith("postgres"):
        try:
            print("DEBUG: Using Standard PostgreSQL Connection String")
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
            print("INFO: Database Engine: Standard PostgreSQL")
            return engine
        except Exception as e:
             print(f"ERROR: Standard Postgres Connection failed: {e}")

    # 3. Fallback: SQLite (Local/Ephemeral)
    print("DEBUG: Using SQLite Fallback")
    
    # Check if we are potentially in Cloud Run (Linux) but missing SQL config
    import os
    if os.path.exists("/tmp"):
        db_url = "sqlite:////tmp/health.db"
    else:
        db_url = "sqlite:///./intelligent_health_dev.db"
        
    engine = create_engine(
        db_url, 
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
    
    # SQLite optimizations
    if "sqlite" in db_url:
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
            
    return engine


engine = get_engine()

# Session factory with optimized settings
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # Don't expire objects after commit for better caching
)

Base = declarative_base()


def get_db():
    """
    Dependency for getting database session.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_db_async():
    """
    Async version of get_db for async endpoints.
    Note: Still uses sync session but wrapped for async compatibility.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_pool_status() -> dict:
    """Get current connection pool status for monitoring."""
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalidated": pool.invalidated(),
    }
