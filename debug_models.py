import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

try:
    from server.database import engine
    import server.models  # This imports all models
    
    print("Initializing models...")
    server.models.Base.metadata.create_all(bind=engine)
    print("Models initialized successfully!")
    
    from sqlalchemy.orm import Session, joinedload
    db = Session(bind=engine)
    
    print("Testing User query...")
    try:
        user = db.query(server.models.User).options(
            joinedload(server.models.User.patient_profile),
            joinedload(server.models.User.doctor_profile)
        ).first()
        print("User query success!")
    except Exception as e:
        with open("db_error.txt", "w") as f:
            f.write(str(e))
            f.write("\n")
            import traceback
            traceback.print_exc(file=f)
        print("Logged error to db_error.txt")


except Exception as e:
    print("\n!!! ERROR DETECTED !!!")
    import traceback
    traceback.print_exc()
