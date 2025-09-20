import sys
import os
from sqlalchemy.orm import Session

# Add the project root to the Python path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.db.base import SessionLocal
from app.db.models import Company, User, UserRole
from app.core.security import get_password_hash

def create_initial_admin_user():
    db: Session = SessionLocal()
    try:
        # Create a default company if it doesn't exist
        company = db.query(Company).filter(Company.id == 1).first()
        if not company:
            company = Company(id=1, name="Default Company")
            db.add(company)
            db.commit()
            db.refresh(company)
            print(f"Created default company: {company.name} (ID: {company.id})")

        # Create the initial admin user
        admin_username = "admin@test.com"
        admin_password = "testpassword"

        user = db.query(User).filter(User.username == admin_username).first()
        if user:
            db.delete(user)
            db.commit()
            print(f"Deleted existing admin user: {admin_username}")

        hashed_password = get_password_hash(admin_password)
        admin_user = User(
            username=admin_username,
            email=admin_username,
            password_hash=hashed_password,
            role=UserRole.company_admin,
            company_id=company.id
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Created admin user: {admin_user.username}")

        # Create a super admin user
        super_admin_username = "superadmin@test.com"
        super_admin_password = "superpassword"

        super_user = db.query(User).filter(User.username == super_admin_username).first()
        if super_user:
            db.delete(super_user)
            db.commit()
            print(f"Deleted existing super admin user: {super_admin_username}")

        hashed_password = get_password_hash(super_admin_password)
        super_admin_user = User(
            username=super_admin_username,
            email=super_admin_username,
            password_hash=hashed_password,
            role=UserRole.super_admin,
            company_id=company.id # Super admin is also associated with a company, but can access all
        )
        db.add(super_admin_user)
        db.commit()
        db.refresh(super_admin_user)
        print(f"Created super admin user: {super_admin_user.username}")
    except Exception as e:
        db.rollback()
        print(f"Error creating initial admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin_user()
