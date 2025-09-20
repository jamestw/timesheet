#!/usr/bin/env python3
"""
Create initial admin user for production deployment
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.models import User, Company, UserRole, Base
from app.core.security import get_password_hash

def create_initial_admin():
    """Create initial admin user and company for production deployment"""

    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL', 'postgresql://timesheet_user:password@localhost:5432/timesheet_db')

    print(f"Connecting to database: {database_url.split('@')[1] if '@' in database_url else database_url}")

    # Create engine and session
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.email == "admin@timesheet.com").first()
        if existing_admin:
            print("Admin user already exists!")
            return

        # Create default company
        default_company = Company(
            name="Default Company",
            address="123 Default Street",
            latitude=None,
            longitude=None
        )
        db.add(default_company)
        db.flush()  # Get the company ID

        # Create admin user
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
        admin_user = User(
            email="admin@timesheet.com",
            full_name="System Administrator",
            hashed_password=get_password_hash(admin_password),
            role=UserRole.super_admin,
            company_id=default_company.id,
            is_active=True
        )
        db.add(admin_user)
        db.commit()

        print("✅ Initial setup completed successfully!")
        print(f"📧 Admin email: admin@timesheet.com")
        print(f"🔑 Admin password: {admin_password}")
        print("🏢 Default company created")
        print("")
        print("🔒 IMPORTANT: Please change the admin password after first login!")
        print("🔒 You can also set a custom password using ADMIN_PASSWORD environment variable")

    except Exception as e:
        print(f"❌ Error creating initial admin: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin()