#!/usr/bin/env python3
"""
Database migration script for adding overtime attendance types
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.api.deps import get_db
from sqlalchemy import text
from contextlib import contextmanager

@contextmanager
def get_db_connection():
    """Get database connection with proper cleanup"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

def run_overtime_migration():
    """Execute the overtime attendance types migration"""

    migration_sql = """
-- Migration: Add overtime attendance types to AttendanceType enum
-- Date: 2025-09-22
-- Description: Extends the AttendanceType enum to support overtime_start and overtime_end

DO $$
BEGIN
    -- Add overtime_start if it doesn't exist
    BEGIN
        ALTER TYPE attendancetype ADD VALUE 'overtime_start';
        RAISE NOTICE 'Added overtime_start to attendancetype enum';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Value overtime_start already exists in attendancetype enum';
    END;

    -- Add overtime_end if it doesn't exist
    BEGIN
        ALTER TYPE attendancetype ADD VALUE 'overtime_end';
        RAISE NOTICE 'Added overtime_end to attendancetype enum';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Value overtime_end already exists in attendancetype enum';
    END;
END$$;
"""

    print("Running overtime attendance types migration...")

    try:
        with get_db_connection() as db:
            # Execute the migration
            db.execute(text(migration_sql))
            db.commit()

            # Verify the enum values
            result = db.execute(text("""
                SELECT enumlabel
                FROM pg_enum
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'attendancetype')
                ORDER BY enumsortorder;
            """))

            enum_values = [row[0] for row in result.fetchall()]
            print("Migration completed successfully!")
            print(f"Current AttendanceType enum values: {', '.join(enum_values)}")

            # Check if our new values are present
            if 'overtime_start' in enum_values and 'overtime_end' in enum_values:
                print("Overtime attendance types added successfully!")
                return True
            else:
                print("Warning: Some overtime types may not have been added")
                return False

    except Exception as e:
        print(f"Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting database migration for overtime attendance types...")
    success = run_overtime_migration()
    if success:
        print("\nMigration completed successfully!")
        sys.exit(0)
    else:
        print("\nMigration failed!")
        sys.exit(1)