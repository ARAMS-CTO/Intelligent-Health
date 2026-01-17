import sys
import traceback

print("Checking server.routes.sdk import...")
try:
    from server.routes import sdk
    print("Successfully imported server.routes.sdk")
except Exception as e:
    print(f"Import Failed: {e}")
    traceback.print_exc()

print("\nChecking server.routes.billing import...")
try:
    from server.routes import billing
    print("Successfully imported server.routes.billing")
except Exception as e:
    print(f"Import Failed: {e}")
    traceback.print_exc()
