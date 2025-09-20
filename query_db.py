import sqlite3

def get_table_info(db_path, table_name):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    conn.close()
    return columns

def query_user_by_email(db_path, email):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, hashed_password, is_active, role FROM users WHERE email = ?", (email,))
    user_data = cursor.fetchone()
    conn.close()
    return user_data

def get_all_users(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, role, is_active FROM users")
    users = cursor.fetchall()
    conn.close()
    return users

if __name__ == "__main__":
    db_path = "sql_app.db"
    table_name = "users"

    print(f"Schema for table {table_name}:")
    columns_info = get_table_info(db_path, table_name)
    for col in columns_info:
        print(col)

    print("\n=== All users in database ===")
    all_users = get_all_users(db_path)
    for user in all_users:
        print(f"ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Role: {user[3]}, Active: {user[4]}")

    print("\n=== Checking specific users ===")
    emails_to_check = ["user@example.com", "superadmin@example.com", "superadmin@test.com"]
    for email in emails_to_check:
        user = query_user_by_email(db_path, email)
        if user:
            print(f"Found {email}: ID={user[0]}, Username={user[1]}, Role={user[5]}")
        else:
            print(f"Not found: {email}")