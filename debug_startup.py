import sys
import traceback

try:
    print("Attempting to import server.main...")
    import server.main
    print("Import successful!")
except ImportError as e:
    print("\n!!! IMPORT ERROR DETECTED !!!")
    traceback.print_exc()
except Exception as e:
    print(f"\n!!! UNEXPECTED ERROR: {e} !!!")
    traceback.print_exc()
