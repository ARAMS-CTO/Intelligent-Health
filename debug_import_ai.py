
import sys
import os

# Add root to path
sys.path.append(os.getcwd())

try:
    print("Importing ai...")
    from server.routes import ai
    print("Success!")
except Exception:
    import traceback
    with open("error.log", "w") as f:
        traceback.print_exc(file=f)
    print("Error captured in error.log")
