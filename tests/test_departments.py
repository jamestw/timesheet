from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import models
from tests.utils import get_admin_auth_headers
from tests.conftest import TestingSessionLocal

def test_create_department(client: TestClient) -> None:
    db: Session = TestingSessionLocal()
    headers = get_admin_auth_headers(client, db)
    response = client.post(
        "/api/v1/companies/1/departments",
        headers=headers,
        json={"name": "HR"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "HR"
    assert data["company_id"] == 1
    db.close()
