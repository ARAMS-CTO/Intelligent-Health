from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
from .config import settings
import google.cloud.sql.connector

print("DEBUG: Loading database.py v0.1.7 - Fully Qualified Import")

# --- DATABASE CONFIG ---
# DB settings are now loaded from server.config.Settings


def get_engine():
    # If we are in Cloud Run, use the Cloud SQL Connector
    if settings.INSTANCE_CONNECTION_NAME:
        try:
            print(f"DEBUG: Attempting Cloud SQL connection to {settings.INSTANCE_CONNECTION_NAME}")
            connector = google.cloud.sql.connector.Connector()
            def getconn():
                conn = connector.connect(
                    settings.INSTANCE_CONNECTION_NAME,
                    "pg8000",
                    user=settings.DB_USER,
                    password=settings.DB_PASS,
                    db=settings.DB_NAME,
                    ip_type=google.cloud.sql.connector.IPTypes.PUBLIC
                )
                return conn

            engine = create_engine(
                "postgresql+pg8000://",
                creator=getconn,
            )
            # Verify connection eagerly to catch errors early
            # with engine.connect() as connection:
            #    print("DEBUG: Cloud SQL Connection Verified")
            return engine
        except Exception as e:
            print(f"ERROR: Cloud SQL Connection Failed. Falling back to SQLite. Details: {e}")
            # Fallback will occur below

    # Fallback for local dev or if Cloud SQL fails
    print("DEBUG: Using SQLite Database")
    db_url = settings.DATABASE_URL
    if not db_url:
        db_url = "sqlite:///./intelligent_health_dev.db"
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
