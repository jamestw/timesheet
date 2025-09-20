#!/usr/bin/env python3
"""
Add attendance_distance_limit column to companies table
"""
import os
import sys
import sqlite3
from decimal import Decimal

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'sql_app.db')

def add_attendance_distance_limit():
    """Add attendance_distance_limit column to companies table"""
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if column already exists
        cursor.execute("PRAGMA table_info(companies)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'attendance_distance_limit' in columns:
            print("Column 'attendance_distance_limit' already exists in companies table")
            return

        # Add the new column with default value
        cursor.execute("""
            ALTER TABLE companies
            ADD COLUMN attendance_distance_limit DECIMAL(6,2) NOT NULL DEFAULT 100.0
        """)

        # Update existing companies to have default distance limit
        cursor.execute("""
            UPDATE companies
            SET attendance_distance_limit = 100.0
            WHERE attendance_distance_limit IS NULL
        """)

        conn.commit()
        print("Successfully added attendance_distance_limit column to companies table")

        # Show updated table structure
        cursor.execute("PRAGMA table_info(companies)")
        columns = cursor.fetchall()
        print("\nUpdated companies table structure:")
        for col in columns:
            print(f"  {col[1]} {col[2]} {'NOT NULL' if col[3] else ''} {f'DEFAULT {col[4]}' if col[4] else ''}")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Adding attendance_distance_limit column to companies table...")
    add_attendance_distance_limit()
    print("Migration completed successfully!")