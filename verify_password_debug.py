import sqlite3
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.core.security import verify_password

def debug_login(db_path, email, password):
    print(f"--- Starting Debug for email: {email} ---")
    
    if not os.path.exists(db_path):
        print(f"ERROR: Database file not found at '{db_path}'")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Find the user by email
        print(f"1. Searching for user with email: {email}")
        cursor.execute("SELECT id, username, hashed_password FROM users WHERE email = ?", (email,))
        user_data = cursor.fetchone()

        if user_data is None:
            print("RESULT: User not found in the database.")
            return

        user_id, username, hashed_password = user_data
        print(f"   - Found user: id={user_id}, username='{username}'")
        print(f"   - Stored Hashed Password: {hashed_password[:10]}...") # Print first 10 chars

        # 2. Verify the password
        print(f"2. Verifying password '{password}' against stored hash...")
        is_password_correct = verify_password(password, hashed_password)

        if is_password_correct:
            print("RESULT: Password verification SUCCESSFUL.")
        else:
            print("RESULT: Password verification FAILED.")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        conn.close()
        print("--- Debug Finished ---")

if __name__ == "__main__":
    db_path = "sql_app.db"
    email_to_check = "superadmin@example.com"
    password_to_check = "password123"
    debug_login(db_path, email_to_check, password_to_check)