import sys
import os

root_dir = os.getcwd()
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    print("Attempting to import server.config...")
    from server.config import settings
    print(f"Success. App Version: {settings.APP_VERSION}")

    print("Attempting to import server.main...")
    from server.main import app
    print("Success. App loaded.")
    
    print("Attempting to import server.database...")
    from server.database import Base
    print("Success. Base loaded.")

except Exception as e:
    print(f"Import Error: {e}")
    import traceback
    traceback.print_exc()
