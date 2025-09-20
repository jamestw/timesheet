import sqlite3
import sys
import os
import traceback
import argparse

# Add the project root to the sys.path to allow importing app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.core.security import get_password_hash
from app.db.models import UserRole

# Try to import bcrypt directly to debug the AttributeError
try:
    import bcrypt
    # print(f"bcrypt module loaded. Version: {bcrypt.__version__}")
except AttributeError:
    print("AttributeError: module 'bcrypt' has no attribute '__version__'")
except ImportError:
    print("bcrypt module not found.")
except Exception as e:
    print(f"Error importing bcrypt: {e}")
    traceback.print_exc()


def create_user_in_db(db_path, username, email, password, first_name, last_name, company_id, department_id, role):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        hashed_password = get_password_hash(password)
    except Exception as e:
        print(f"Error hashing password: {e}")
        traceback.print_exc()
        conn.close()
        return

    try:
        cursor.execute(
            "INSERT INTO users (username, email, hashed_password, first_name, last_name, company_id, department_id, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (username, email, hashed_password, first_name, last_name, company_id, department_id, role.value, True)
        )
        conn.commit()
        print(f"User '{username}' created successfully with role '{role.value}'.")
    except sqlite3.IntegrityError as e:
        print(f"Error creating user {username}: {e}")
        # Check if the error is due to duplicate username or email
        if "UNIQUE constraint failed: users.username" in str(e):
            print(f"User with username '{username}' already exists.")
        elif "UNIQUE constraint failed: users.email" in str(e):
            print(f"User with email '{email}' already exists.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new user in the database.")
    parser.add_argument("--username", required=True, help="Username for the new user.")
    parser.add_argument("--email", required=True, help="Email for the new user.")
    parser.add_argument("--password", required=True, help="Password for the new user.")
    parser.add_argument("--role", required=True, choices=[role.value for role in UserRole], help="Role for the new user.")
    parser.add_argument("--company-id", type=int, required=True, help="Company ID for the user.")
    parser.add_argument("--department-id", type=int, default=None, help="Optional: Department ID for the user.")
    parser.add_argument("--first-name", default="", help="Optional: First name.")
    parser.add_argument("--last-name", default="", help="Optional: Last name.")
    
    args = parser.parse_args()

    db_path = "sql_app.db"
    
    # For department_id, we need to pass None if it's not provided, not 0
    department_id = args.department_id if args.department_id is not None else None

    create_user_in_db(
        db_path,
        username=args.username,
        email=args.email,
        password=args.password,
        first_name=args.first_name,
        last_name=args.last_name,
        company_id=args.company_id,
        department_id=department_id,
        role=UserRole(args.role)
    )
