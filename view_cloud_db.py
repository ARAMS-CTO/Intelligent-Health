
import requests
import json
import sys

# Production URL
BASE_URL = "https://intelligent-health-app-jsc5mqgzua-uc.a.run.app"

def view_cloud_table(table_name):
    print(f"Fetching data for table '{table_name}' from {BASE_URL}...")
    try:
        response = requests.get(f"{BASE_URL}/api/debug/view/{table_name}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "data" in data and isinstance(data["data"], list):
                print(f"--- Table: {table_name} ({data.get('count', 0)} rows) ---")
                if len(data["data"]) == 0:
                     print("(Empty)")
                else:
                    # Print header
                    keys = data["data"][0].keys()
                    print(" | ".join(keys))
                    print("-" * 50)
                    for row in data["data"]:
                        # Truncate long values
                        vals = [str(v)[:30] + "..." if len(str(v))>30 else str(v) for v in row.values()]
                        print(" | ".join(vals))
            else:
                print("Error or Empty:", data)
        else:
            print(f"Failed to fetch: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        view_cloud_table(sys.argv[1])
    else:
        # Default view
        view_cloud_table("users")
