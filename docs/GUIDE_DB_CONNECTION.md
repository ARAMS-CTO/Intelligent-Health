# Database Connection Guide

To access the database tables, you can use the **SQLTools** extension in VS Code or any PostgreSQL/SQLite client. The connection details depend on whether you are connecting to the **Local Development** database or the **Cloud Production** database.

## 1. Local Development (SQLite)

If you are running the server locally without configuring a dedicated PostgreSQL instance, the application uses **SQLite** by default.

- **Driver**: SQLite
- **Database File**: `f:\PROJECTS\Inteligent Health\intelligent_health.db`
- **Connection Name**: `Intelligent Health (Local)`

### VS Code SQLTools Setup:
1. Open SQLTools.
2. Click "Add New Connection".
3. Select **SQLite**.
4. Set **Database File** to: `f:\PROJECTS\Inteligent Health\intelligent_health.db`
5. Click **Save Connection**.

## 2. Cloud Production (PostgreSQL)

If checking the production database on Google Cloud SQL:

- **Driver**: PostgreSQL
- **Host**: `34.135.195.122` (Example Public IP - Check your Cloud SQL Console)
- **User**: `postgres` (or as configured in Cloud Run env vars `DB_USER`)
- **Password**: `YourStrongPassword123!` (or as configured in `DB_PASS`)
- **Database**: `postgres`
- **Port**: `5432`

**Note:** To connect from your local machine to Cloud SQL, you must **authorize your IP address** in the Google Cloud SQL Networking settings, or use the **Cloud SQL Auth Proxy**.

### Using Cloud SQL Auth Proxy (Recommended):
1. Install Cloud SQL Auth Proxy.
2. Run: `./cloud_sql_proxy -instances=intelligent-health-977696014858:us-central1:intelligent-health-db=tcp:5432`
3. Connect via localhost:5432 using the credentials above.
