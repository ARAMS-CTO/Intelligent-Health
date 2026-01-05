from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from ..database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/db", tags=["Debug"])
async def debug_db_connection(db: Session = Depends(get_db)):
    """
    Test the database connection by executing a simple query.
    """
    try:
        # Execute a simple query
        result = db.execute(text("SELECT 1")).scalar()
        
        # Check dialect
        dialect = db.bind.dialect.name
        
        return {
            "status": "connected", 
            "result": result, 
            "dialect": dialect,
            "message": "Database connection successful"
        }
    except Exception as e:
        print(f"DB Debug Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error", 
            "error": str(e),
            "message": "Database connection failed"
        }

@router.post("/seed", tags=["Debug"])
async def seed_database_endpoint():
    """
    Triggers the seeding process for the database.
    WARNING: This should be restricted in production, but open for this demo/deployment phase.
    """
    try:
        from ..seed_data import seed_users
        seed_users()
        return {"status": "success", "message": "Database seeded successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

