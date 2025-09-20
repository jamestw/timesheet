from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db import models
from tests.conftest import TestingSessionLocal

def test_login_access_token(client: TestClient) -> None:
    db: Session = TestingSessionLocal()
    # Create a dummy company first
    company = models.Company(id=1, name="Test Corp")
    db.add(company)
    db.commit()

    # Create a test user
    test_username = "testuser@example.com"
    test_password = "testpassword"
    user = models.User(
        username=test_username,
        email=test_username,
        password_hash=get_password_hash(test_password),
        company_id=1
    )
    db.add(user)
    db.commit()

    # Attempt to login
    login_data = {"username": test_username, "password": test_password}
    r = client.post("/api/v1/login/access-token", data=login_data)
    assert r.status_code == 200
    tokens = r.json()
    assert "access_token" in tokens
    assert tokens["token_type"] == "bearer"

    db.close()
