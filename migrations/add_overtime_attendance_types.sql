-- Migration: Add overtime attendance types to AttendanceType enum
-- Date: 2025-09-22
-- Description: Extends the AttendanceType enum to support overtime_start and overtime_end

-- For PostgreSQL, we need to add new values to the existing enum type
-- Note: This requires PostgreSQL 9.1+ for ALTER TYPE ... ADD VALUE

-- First, check if the enum already has the overtime values
-- If not, add them

DO $$
BEGIN
    -- Add overtime_start if it doesn't exist
    BEGIN
        ALTER TYPE attendancetype ADD VALUE 'overtime_start';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Value overtime_start already exists in attendancetype enum';
    END;

    -- Add overtime_end if it doesn't exist
    BEGIN
        ALTER TYPE attendancetype ADD VALUE 'overtime_end';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Value overtime_end already exists in attendancetype enum';
    END;
END$$;

-- Verify the enum values
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'attendancetype')
ORDER BY enumsortorder;