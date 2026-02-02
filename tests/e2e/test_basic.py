
import pytest

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_auth_flow(client):
    # Register
    reg_payload = {
        "name": "New User",
        "email": "new@example.com",
        "password": "strongpassword",
        "role": "Patient"
    }
    response = await client.post("/api/auth/register", json=reg_payload)
    if response.status_code == 400 and "already exists" in response.text:
        # Already registered in previous run, try login
        pass
    else:
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    # Login
    login_payload = {
        "email": "new@example.com",
        "password": "strongpassword"
    }
    response = await client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Access Protected Route
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "new@example.com"

@pytest.mark.asyncio
async def test_file_upload_forbidden_without_auth(client):
    # Try upload without token
    files = {'file': ('test.txt', b'content', 'text/plain')}
    response = await client.post("/api/files/upload", files=files)
    # Should be 403 (RBAC) or 401 (Auth)
    # Our RBAC middleware returns 403 if role check fails, 
    # but auth dependency might catch it first as 401.
    assert response.status_code in [401, 403]
