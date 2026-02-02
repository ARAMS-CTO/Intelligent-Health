"""
Database Migration Script
Initializes and updates database schema for Intelligent Health Platform

Run from the server directory:
  python create_tables.py

This script creates all tables defined in models.py using SQLAlchemy's
create_all method. It's safe to run multiple times - existing tables won't be dropped.
"""

import os
import sys

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set environment variables for local development if not set
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///./health_data.db"

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL from environment"""
    return os.getenv("DATABASE_URL", "sqlite:///./health_data.db")

def create_tables():
    """Create all database tables"""
    db_url = get_database_url()
    logger.info(f"📦 Connecting to database: {db_url[:50]}...")
    
    # Create engine
    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, echo=False)
    else:
        engine = create_engine(db_url, echo=False, pool_pre_ping=True)
    
    # Import Base and all models to register them
    from sqlalchemy.ext.declarative import declarative_base
    
    # We need to import models which will trigger their registration with Base
    # Import the Base from the actual database module
    try:
        # Try direct import (when run as script)
        from database import Base
        import models  # This imports all models
    except ImportError:
        # Fallback for package imports
        from server.database import Base
        from server import models
    
    # Get current tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    logger.info(f"📊 Existing tables: {len(existing_tables)}")
    
    # Get all model tables
    model_tables = list(Base.metadata.tables.keys())
    logger.info(f"📋 Model tables: {len(model_tables)}")
    
    # Find new tables
    new_tables = [t for t in model_tables if t not in existing_tables]
    if new_tables:
        logger.info(f"🆕 New tables to create: {new_tables}")
    else:
        logger.info("✅ All tables already exist")
    
    # Create all tables
    logger.info("🔧 Creating/updating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Verify
    inspector = inspect(engine)
    final_tables = inspector.get_table_names()
    logger.info(f"✅ Tables after migration: {len(final_tables)}")
    
    # List new Phase 2 tables
    phase2_tables = [
        'vital_readings',
        'care_plans',
        'care_plan_goals', 
        'care_plan_tasks',
        'emergency_profiles',
        'health_events'
    ]
    
    for table in phase2_tables:
        status = "✅" if table in final_tables else "❌"
        logger.info(f"  {status} {table}")
    
    logger.info("🎉 Database migration complete!")
    return engine

def test_connection():
    """Test database connection"""
    engine = create_tables()
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        logger.info(f"🔗 Database connection test: OK ({result.scalar()})")
    
    return True

if __name__ == "__main__":
    print("=" * 50)
    print("Intelligent Health - Database Migration")
    print("=" * 50)
    
    try:
        test_connection()
        print("\n✅ Migration successful!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
