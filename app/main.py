from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.routers import companies, departments, users, login, attendance, register
from app.core.config import settings

app = FastAPI(title="Timesheet System API", version="1.0.0")

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default port
    "http://localhost:5174", # Alternative Vite port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    # Production origins (will be added dynamically based on environment)
]

# Add production origins if not in development
import os
if os.getenv('ENVIRONMENT') == 'production':
    domain = os.getenv('DOMAIN')
    if domain:
        origins.extend([
            f"https://{domain}",
            f"http://{domain}",
        ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Timesheet System API is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "secret_key_prefix": settings.SECRET_KEY[:10]}

# Include routers
app.include_router(login.router, prefix="/api/v1", tags=["login"])
app.include_router(register.router, prefix="/api/v1", tags=["register"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(departments.router, prefix="/api/v1/companies/{company_id}/departments", tags=["departments"])
app.include_router(users.router, prefix="/api/v1/companies/{company_id}/users", tags=["users"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["attendance"])

if __name__ == "__main__":
    print(f"Starting Timesheet System API...")
    print(f"SECRET_KEY: {settings.SECRET_KEY[:10]}...")
    print(f"Database URL: {settings.DATABASE_URL}")
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)