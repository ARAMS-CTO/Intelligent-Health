from server.config import settings

def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "name": "Test User",
            "role": "Patient"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"
    assert "access_token" in data

def test_login_user(client):
    # 1. Register first
    client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "password123",
            "name": "Login User",
            "role": "Patient"
        }
    )
    
    # 2. Login
    response = client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "password123",
            "role": "Patient"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client):
    # 1. Register
    client.post(
        "/api/auth/register",
        json={
            "email": "fail@example.com",
            "password": "password123",
            "name": "Fail User",
            "role": "Patient"
        }
    )
    
    # 2. Login with wrong password
    response = client.post(
        "/api/auth/login",
        json={
            "email": "fail@example.com",
            "password": "wrongpassword",
            "role": "Patient"
        }
    )
    assert response.status_code == 401

def test_config_endpoint(client):
    response = client.get("/api/auth/config")
    assert response.status_code == 200
    data = response.json()
    assert data["appVersion"] == settings.APP_VERSION
