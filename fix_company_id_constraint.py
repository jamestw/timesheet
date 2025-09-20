#!/usr/bin/env python3
"""
Fix company_id constraint in users table to allow NULL
"""
import sqlite3
import os

def fix_company_id_constraint():
    db_path = "sql_app.db"

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Checking current users table schema...")
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
        current_schema = cursor.fetchone()[0]
        print("Current schema:")
        print(current_schema)
        print()

        # Check if company_id has NOT NULL constraint
        if "company_id" in current_schema and "NOT NULL" in current_schema:
            print("company_id has NOT NULL constraint. Need to recreate table...")

            # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
            # First, backup existing data
            cursor.execute("SELECT * FROM users")
            existing_users = cursor.fetchall()

            # Get column names
            cursor.execute("PRAGMA table_info(users)")
            columns_info = cursor.fetchall()
            column_names = [col[1] for col in columns_info]

            print(f"Found {len(existing_users)} existing users")
            print(f"Columns: {column_names}")

            # Create new table with correct schema
            cursor.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    company_id INTEGER,
                    username VARCHAR UNIQUE NOT NULL,
                    email VARCHAR UNIQUE NOT NULL,
                    hashed_password VARCHAR NOT NULL,
                    first_name VARCHAR NOT NULL,
                    last_name VARCHAR NOT NULL,
                    role VARCHAR(15),
                    department_id INTEGER,
                    is_active BOOLEAN,
                    last_login_at DATETIME,
                    created_at DATETIME,
                    updated_at DATETIME,
                    id_number TEXT,
                    employee_number TEXT,
                    phone TEXT,
                    gender TEXT,
                    birth_date DATE,
                    address TEXT,
                    emergency_contact_name TEXT,
                    emergency_contact_phone TEXT,
                    company_tax_id TEXT,
                    status TEXT,
                    approved_by INTEGER,
                    approved_at DATETIME,
                    rejection_reason TEXT,
                    notes TEXT,
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
                    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """)

            # Copy data to new table if any exists
            if existing_users:
                placeholders = ','.join(['?' for _ in column_names])
                cursor.executemany(f"INSERT INTO users_new ({','.join(column_names)}) VALUES ({placeholders})", existing_users)
                print(f"Copied {len(existing_users)} users to new table")

            # Drop old table and rename new one
            cursor.execute("DROP TABLE users")
            cursor.execute("ALTER TABLE users_new RENAME TO users")

            print("Successfully recreated users table with nullable company_id")
        else:
            print("company_id constraint looks correct")

        conn.commit()

        # Verify the final schema
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
        final_schema = cursor.fetchone()[0]
        print("\nFinal schema:")
        print(final_schema)

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_company_id_constraint()