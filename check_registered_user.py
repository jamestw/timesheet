#!/usr/bin/env python3
"""
Check the registered user to verify company_id is set correctly
"""
import sqlite3
import os

def check_registered_user():
    db_path = "sql_app.db"

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check the registered user
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.company_id, u.company_tax_id, u.status,
                   c.id as company_db_id, c.name as company_name, c.tax_id as company_db_tax_id
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.email = 'test@example.com'
        """)

        user_data = cursor.fetchone()

        if user_data:
            print("Registered user details:")
            print(f"  User ID: {user_data[0]}")
            print(f"  Username: {user_data[1]}")
            print(f"  Email: {user_data[2]}")
            print(f"  Company ID (user table): {user_data[3]}")
            print(f"  Company Tax ID (user table): {user_data[4]}")
            print(f"  Status: {user_data[5]}")
            print(f"  Company ID (companies table): {user_data[6]}")
            print(f"  Company Name: {user_data[7]}")
            print(f"  Company Tax ID (companies table): {user_data[8]}")

            if user_data[3] == user_data[6] and user_data[4] == user_data[8]:
                print("\n✅ SUCCESS: User is correctly associated with the company!")
                print(f"   Tax ID {user_data[4]} -> Company: {user_data[7]} (ID: {user_data[6]})")
            else:
                print("\n❌ ERROR: User company association is incorrect!")
        else:
            print("User not found!")

        # Also check all users
        cursor.execute("SELECT id, username, email, company_id, company_tax_id, status FROM users")
        all_users = cursor.fetchall()

        print(f"\nAll users in database ({len(all_users)}):")
        for user in all_users:
            print(f"  ID:{user[0]} | {user[1]} | {user[2]} | Company ID:{user[3]} | Tax ID:{user[4]} | Status:{user[5]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_registered_user()