#!/usr/bin/env python3
"""
Check existing companies in the database
"""
import sqlite3
import os

def check_companies():
    db_path = "sql_app.db"

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check companies table structure
        cursor.execute("PRAGMA table_info(companies)")
        columns = cursor.fetchall()
        print("Companies table structure:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        print()

        # Check existing companies
        cursor.execute("SELECT id, name, tax_id, address FROM companies")
        companies = cursor.fetchall()

        print(f"Found {len(companies)} companies:")
        for company in companies:
            print(f"  ID: {company[0]}, Name: {company[1]}, Tax ID: {company[2]}, Address: {company[3]}")

        # If companies exist but don't have tax_id, suggest adding some
        if companies and all(company[2] is None for company in companies):
            print("\nNo companies have tax_id set. Let's add some sample tax_ids...")
            for i, company in enumerate(companies):
                sample_tax_id = f"1234567{i}"
                cursor.execute("UPDATE companies SET tax_id = ? WHERE id = ?", (sample_tax_id, company[0]))
                print(f"  Updated company {company[1]} with tax_id: {sample_tax_id}")

            # Commit the changes
            conn.commit()
            print("Tax IDs updated successfully!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_companies()