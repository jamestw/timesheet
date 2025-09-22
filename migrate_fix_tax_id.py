#!/usr/bin/env python3
"""
Migration script to make tax_id nullable in companies table
"""

import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables")

def run_migration():
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print("Connected to PostgreSQL database")

        # Make tax_id nullable
        print("Making tax_id column nullable...")
        cursor.execute("ALTER TABLE companies ALTER COLUMN tax_id DROP NOT NULL;")

        # Commit the changes
        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()