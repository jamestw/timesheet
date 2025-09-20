from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db import models
from tests.utils import get_admin_auth_headers
from tests.conftest import TestingSessionLocal

def test_create_company(client: TestClient) -> None:
    db: Session = TestingSessionLocal()
    headers = get_admin_auth_headers(client, db)
    response = client.post(
        "/api/v1/companies",
        headers=headers,
        json={"name": "Test Company", "contact_person": "Test Person"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Company"
    assert data["contact_person"] == "Test Person"
    db.close()

def test_read_company(client: TestClient) -> None:
    db: Session = TestingSessionLocal()
    headers = get_admin_auth_headers(client, db)
    company = models.Company(name="Another Test Co")
    db.add(company)
    db.commit()

    response = client.get(f"/api/v1/companies/{company.id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Another Test Co"
    db.close()
