
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

@router.get("/view/{table_name}", tags=["Debug"])
async def view_table_data(table_name: str, db: Session = Depends(get_db)):
    """
    View raw data from a table. Restricted to known tables for safety.
    """
    allowed_tables = ["users", "cases", "patients", "medical_records", "ai_feedback", "system_logs", "newsletter_subscriptions"]
    if table_name not in allowed_tables:
        return {"error": f"Table '{table_name}' access restricted or invalid."}
        
    try:
        # Simple select * limit 50
        result = db.execute(text(f"SELECT * FROM {table_name} LIMIT 50"))
        rows = result.fetchall()
        # Convert to list of dicts
        columns = result.keys()
        data = [dict(zip(columns, row)) for row in rows]
        return {"table": table_name, "count": len(data), "data": data}
    except Exception as e:
        return {"error": str(e)}
