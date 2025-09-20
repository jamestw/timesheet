-- PostgreSQL Database Initialization Script
-- This script will be run when the database container starts for the first time

-- Create the database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS timesheet_db;

-- Switch to the timesheet database
\c timesheet_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone to UTC
SET timezone = 'UTC';

-- You can add any additional database initialization here
-- For example, creating indexes, setting up permissions, etc.

-- Note: The actual table creation will be handled by SQLAlchemy/Alembic
-- This file is just for any initial database setup that needs to happen
-- before the application starts