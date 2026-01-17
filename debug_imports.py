
import sys
import os

# Add root to path
sys.path.append(os.getcwd())

try:
    print("Importing auth...")
    from server.routes import auth
    print("Importing cases...")
    from server.routes import cases
    print("Importing lab...")
    from server.routes import lab
    print("Importing pharmacy...")
    from server.routes import pharmacy
    print("Importing sdk...")
    from server.routes import sdk
    print("Importing __init__...")
    from server.routes import init_app
    print("All good!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
