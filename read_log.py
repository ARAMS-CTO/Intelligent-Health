try:
    path = "startup_error_5.txt"
    with open(path, "rb") as f:
        content = f.read().decode("utf-16", errors="ignore")
        if not content.strip():
             f.seek(0)
             content = f.read().decode("utf-8", errors="ignore")
        print("--- DEBUG OUTPUT START ---")
        print(content)
        print("--- DEBUG OUTPUT END ---")
except Exception as e:
    print(f"Read failed: {e}")
