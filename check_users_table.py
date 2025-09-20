#!/usr/bin/env python3
"""
Check users table structure and add missing columns
"""
import sqlite3
import os

def check_and_fix_users_table():
    db_path = "sql_app.db"

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check current users table structure
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        print("Current users table columns:")
        for col in columns:
            print(f"  {col}")
        print()

        # Define all required columns based on our model
        required_columns = [
            ('phone', 'TEXT'),
            ('gender', 'TEXT'),
            ('birth_date', 'DATE'),
            ('address', 'TEXT'),
            ('emergency_contact_name', 'TEXT'),
            ('emergency_contact_phone', 'TEXT'),
            ('id_number', 'TEXT'),
            ('employee_number', 'TEXT'),
            ('company_tax_id', 'TEXT'),
            ('role', 'TEXT'),
            ('department_id', 'INTEGER'),
            ('status', 'TEXT'),
            ('approved_by', 'INTEGER'),
            ('approved_at', 'DATETIME'),
            ('rejection_reason', 'TEXT'),
            ('is_active', 'BOOLEAN'),
            ('last_login_at', 'DATETIME'),
            ('notes', 'TEXT'),
            ('created_at', 'DATETIME'),
            ('updated_at', 'DATETIME')
        ]

        # Add missing columns
        added_columns = []
        for col_name, col_type in required_columns:
            if col_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                    added_columns.append(col_name)
                    print(f"Added column: {col_name} ({col_type})")
                except Exception as e:
                    print(f"Error adding {col_name}: {e}")

        if added_columns:
            conn.commit()
            print(f"\nSuccessfully added {len(added_columns)} columns to users table")
        else:
            print("All required columns already exist")

        # Show final structure
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        print(f"\nFinal users table structure ({len(columns)} columns):")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    check_and_fix_users_table()