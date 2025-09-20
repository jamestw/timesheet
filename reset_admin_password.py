import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base, SessionLocal
from app.db.models import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

# Add the project root to the Python path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

# Database setup
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# New password for the super admin
NEW_PASSWORD = "NewAdminPass!2025"

def reset_super_admin_password(admin_email: str):
    print(f"Using database URL: {SQLALCHEMY_DATABASE_URL}")
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if admin_user:
            print(f"Found user {admin_email}. Current hashed password: {admin_user.hashed_password}")
            admin_user.hashed_password = get_password_hash(NEW_PASSWORD)
            db.add(admin_user)
            db.flush() # Ensure changes are written to the session
            db.commit()
            db.refresh(admin_user)
            print(f"Super admin password for {admin_email} has been reset to: {NEW_PASSWORD}")
            print(f"New hashed password in DB after commit: {admin_user.hashed_password}")
        else:
            print(f"Super admin user with email {admin_email} not found.")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reset_admin_password.py <admin_email>")
        sys.exit(1)
    admin_email = sys.argv[1]
    reset_super_admin_password(admin_email)
