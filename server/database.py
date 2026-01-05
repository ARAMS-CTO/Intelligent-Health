from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# --- DATABASE CONFIG ---
# DB settings are now loaded from server.config.Settings


def get_engine():
    # If we are in Cloud Run, use the Cloud SQL Connector
    if settings.INSTANCE_CONNECTION_NAME:
        connector = Connector()
        def getconn():
            conn = connector.connect(
                settings.INSTANCE_CONNECTION_NAME,
                "pg8000",
                user=settings.DB_USER,
                password=settings.DB_PASS,
                db=settings.DB_NAME,
                ip_type=IPTypes.PUBLIC  # Use PUBLIC or PRIVATE depending on setup
            )
            return conn

        return create_engine(
            "postgresql+pg8000://",
            creator=getconn,
            # Cloud SQL Connector handles connection pooling
        )
    else:
        # Fallback for local dev
        db_url = settings.DATABASE_URL
        if not db_url:
            # Default to SQLite for zero-config local dev
            db_url = "sqlite:///./intelligent_health.db"
            return create_engine(
                db_url, 
                connect_args={"check_same_thread": False}
            )
        return create_engine(db_url)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
