# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-tenant timesheet and attendance management system with a FastAPI backend and React PWA frontend. The system allows companies to manage employee attendance, overtime, and leave applications through web and mobile interfaces.

## Architecture

- **Backend**: FastAPI (Python) with SQLAlchemy ORM
- **Frontend**: React + TypeScript + Vite with shadcn/ui components
- **Database**: SQLite (configured for PostgreSQL in production per PRD)
- **Authentication**: JWT tokens with passlib for password hashing
- **Multi-tenancy**: Company-based data isolation

### Key Backend Structure
- `app/main.py` - FastAPI application entry point
- `app/api/routers/` - API route handlers organized by feature
- `app/core/` - Core configuration and security
- `app/db/` - Database models and initialization
- `app/schemas/` - Pydantic schemas for request/response validation

### Key Frontend Structure
- `frontend/src/` - React application source
- Uses shadcn/ui component library with Tailwind CSS
- PWA capabilities via vite-plugin-pwa

## Common Development Commands

### Backend (Python)
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
cd app && python main.py
# or
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Run tests
pytest

# Create initial admin user
python app/db/create_initial_admin.py

# Reset admin password
python reset_admin_password.py
```

### Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Database

- Currently using SQLite (`sql_app.db`) for development
- Database models are in `app/db/models.py`
- Supports multi-tenant architecture with company-based data isolation
- Database initialization script at `app/db/init_db.py`

## Key Features

1. **Multi-tenant Company Management** - Separate data per company
2. **User Roles** - Employee, Department Head, Company Admin
3. **Attendance Tracking** - GPS-based check-in/out with location validation
4. **Leave & Overtime Applications** - Request and approval workflow
5. **Reporting** - Monthly attendance reports and exports
6. **PWA Support** - Progressive Web App for mobile access

## API Structure

- Base URL: `/api/v1`
- Authentication endpoints: `/api/v1/login`
- Company-scoped endpoints: `/api/v1/companies/{company_id}/...`
- Cross-company endpoints: `/api/v1/attendance`

## Development Notes

- Backend runs on port 8001 by default
- Frontend development server runs on port 5173
- CORS is configured for local development
- JWT tokens expire after 30 minutes (configurable)
- Environment variables can be set via `.env` file

## Security

- Password hashing with bcrypt via passlib
- JWT authentication with python-jose
- Multi-part form support for file uploads
- CORS middleware configured for development origins