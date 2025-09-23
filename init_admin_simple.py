import os
import sys
sys.path.append('/app')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = 'postgresql://apiuser:Devo0932@172.19.0.4:5432/timesheet'
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables using raw SQL
with engine.connect() as conn:
    # Create enum types first
    conn.execute(text("""
        CREATE TYPE userrole AS ENUM ('employee', 'department_head', 'company_admin', 'super_admin');
    """))
    
    # Create companies table
    conn.execute(text("""
        CREATE TABLE companies (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            latitude FLOAT,
            longitude FLOAT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """))
    
    # Create users table
    conn.execute(text("""
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(255) UNIQUE,
            full_name VARCHAR(255),
            hashed_password VARCHAR(255) NOT NULL,
            role userrole NOT NULL,
            company_id INTEGER REFERENCES companies(id),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """))
    
    # Insert default company
    conn.execute(text("""
        INSERT INTO companies (name, address, latitude, longitude) 
        VALUES ('Default Company', '123 Default Street', NULL, NULL);
    """))
    
    # Insert admin user
    conn.execute(text("""
        INSERT INTO users (email, username, full_name, hashed_password, role, company_id, is_active) 
        VALUES (
            'admin@timesheet.com', 
            'admin', 
            'System Administrator',
            'b2.8TtKcCzGwDzJhVtBrXnVq8y',
            'super_admin', 
            1, 
            TRUE
        );
    """))
    
    conn.commit()

print('✅ Database initialized with admin user')
print('📧 Admin email: admin@timesheet.com')
print('🔑 Admin password: Admin123!')
