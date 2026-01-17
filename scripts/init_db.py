from server.database import engine, Base
import server.models
import os

print("Initializing Database...")
if os.path.exists("intelligent_health.db"):
    print("Database file exists (re-recreating tables if needed)...")
    Base.metadata.drop_all(bind=engine) # Optional: Wipe clean
    print("Tables dropped.")

Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
