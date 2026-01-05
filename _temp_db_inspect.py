
import sqlite3
import os

db_path = 'intelligent_health.db'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit()

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Tables found ({len(tables)}): {', '.join(tables)}")
    print("-" * 40)
    
    # Check Users
    if 'users' in tables:
        print("\n[User Table Sample]")
        cursor.execute("SELECT id, name, email, role FROM users LIMIT 10")
        users = cursor.fetchall()
        for u in users:
            print(f"- {u[1]} ({u[2]}) - {u[3]}")
            
    conn.close()
except Exception as e:
    print(f"Error reading DB: {e}")
