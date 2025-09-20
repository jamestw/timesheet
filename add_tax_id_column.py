#!/usr/bin/env python3
"""
Add tax_id column to companies table
"""
import sqlite3
import os

def add_tax_id_column():
    db_path = "sql_app.db"

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if tax_id column already exists
        cursor.execute("PRAGMA table_info(companies)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'tax_id' not in columns:
            # Add tax_id column
            cursor.execute("ALTER TABLE companies ADD COLUMN tax_id TEXT")
            print("Added tax_id column to companies table")

            # Create unique index for tax_id (after adding some data)
            # cursor.execute("CREATE UNIQUE INDEX idx_companies_tax_id ON companies(tax_id)")
            # print("Created unique index on tax_id")

        else:
            print("tax_id column already exists")

        conn.commit()
        print("Database updated successfully!")

        # Show updated structure
        cursor.execute("PRAGMA table_info(companies)")
        columns = cursor.fetchall()
        print("\nUpdated companies table structure:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_tax_id_column()