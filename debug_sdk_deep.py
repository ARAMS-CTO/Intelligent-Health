import sys
import traceback
import os

# Ensure we can import server
sys.path.append(os.getcwd())

try:
    print("Step 1: Importing server.models...")
    import server.models as models
    print(f"server.models imported: {models}")
    print(f"Has PartnerAPIKey? {'PartnerAPIKey' in dir(models)}")
    
    print("Step 2: Importing server.routes.sdk...")
    from server.routes import sdk
    print("server.routes.sdk imported successfully")

except Exception as e:
    print("\n!!! ERROR !!!")
    traceback.print_exc()
