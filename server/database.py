from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from google.cloud.sql.connector import Connector, IPTypes

# --- DATABASE CONFIG ---
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "YourStrongPassword123!")
DB_NAME = os.getenv("DB_NAME", "postgres")
INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME") # e.g. project:region:instance

def get_engine():
    # If we are in Cloud Run, use the Cloud SQL Connector
    if INSTANCE_CONNECTION_NAME:
        connector = Connector()
        def getconn():
            conn = connector.connect(
                INSTANCE_CONNECTION_NAME,
                "pg8000",
                user=DB_USER,
                password=DB_PASS,
                db=DB_NAME,
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
        default_url = "postgresql://user:password@localhost/intelligent_health"
        db_url = os.getenv("DATABASE_URL", default_url)
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
