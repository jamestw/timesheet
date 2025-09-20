#!/usr/bin/env python3
"""
Simple script to add new columns to existing database
"""
import sqlite3
import os

def add_columns_to_users_table():
    db_path = "sql_app.db"

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        # Add id_number column if it doesn't exist
        if 'id_number' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN id_number TEXT")
            print("Added id_number column to users table")
        else:
            print("id_number column already exists")

        # Add employee_number column if it doesn't exist
        if 'employee_number' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN employee_number TEXT")
            print("Added employee_number column to users table")
        else:
            print("employee_number column already exists")

        conn.commit()
        print("Database updated successfully!")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_columns_to_users_table()