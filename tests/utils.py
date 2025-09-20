from typing import Dict

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db import models

def get_admin_auth_headers(client: TestClient, db: Session) -> Dict[str, str]:
    # Create a test company if it doesn't exist
    company = db.query(models.Company).filter(models.Company.id == 1).first()
    if not company:
        company = models.Company(id=1, name="Default Test Corp")
        db.add(company)
        db.commit()

    # Create an admin user
    admin_username = "admin@test.com"
    admin_password = "testpassword"
    admin_user = db.query(models.User).filter(models.User.username == admin_username).first()
    if not admin_user:
        admin_user = models.User(
            username=admin_username,
            email=admin_username,
            password_hash=get_password_hash(admin_password),
            role="company_admin",
            company_id=1
        )
        db.add(admin_user)
        db.commit()

    # Login
    login_data = {
        "username": admin_username,
        "password": admin_password,
    }
    r = client.post(f"/api/v1/login/access-token", data=login_data)
    tokens = r.json()
    a_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {a_token}"}
    return headers
