# Implementation Plan: Core Backend API - Phase 1

**Specification**: `spec.md`  
**Status**: Draft

## 1. Technical Approach

Following the PRD and our Constitution, we will build the backend API using Python with the **FastAPI** framework. This choice aligns with the PRD's recommendation and is well-suited for creating high-performance, well-documented RESTful APIs.

- **Database Interaction**: We will use **SQLAlchemy** as the ORM to map our database tables (`companies`, `users`, `departments`) to Python objects. This provides a robust and maintainable way to interact with the PostgreSQL database.
- **Data Validation**: **Pydantic** schemas will be used extensively to define the shape of API request and response bodies. This ensures all data is validated at the boundary, improving security and reliability.
- **Authentication**: We will implement **JWT (JSON Web Tokens)** for securing the API. A login endpoint will issue tokens, which will be required for accessing protected resources.
- **Authorization**: A custom dependency injection system in FastAPI will be created to check user roles (e.g., `company_admin`) for authorization, enforcing the principle of least privilege.

## 2. Project Structure

We will adopt a standard, scalable project structure:

```
/app
├── api/
│   ├── __init__.py
│   ├── routers/
│   │   ├── companies.py
│   │   ├── departments.py
│   │   └── users.py
│   └── v1.py  # Main API router
├── core/
│   ├── __init__.py
│   ├── config.py       # Environment variables
│   └── security.py     # Password hashing, JWT
├── db/
│   ├── __init__.py
│   ├── base.py         # Base model and session
│   └── models.py       # SQLAlchemy models
├── schemas/
│   ├── __init__.py
│   ├── company.py
│   ├── department.py
│   └── user.py         # Pydantic schemas
└── main.py             # FastAPI app entrypoint
/tests
  ├── ...
```

## 3. Development Phases

### Phase 1: Project & Database Setup
1.  **Initialize Project**: Set up a new Python project with a virtual environment and a `requirements.txt` file.
2.  **Install Dependencies**: Install FastAPI, Uvicorn, SQLAlchemy, Psycopg2, Pydantic, and Passlib.
3.  **Database Models**: Create the SQLAlchemy models in `app/db/models.py` corresponding to the `companies`, `departments`, and `users` tables from the PRD.
4.  **Pydantic Schemas**: Define the Pydantic schemas in the `app/schemas/` directory for API data validation.

### Phase 2: Core API Endpoint Implementation
1.  **API Routers**: Create the router files in `app/api/routers/` for each resource (`companies`, `departments`, `users`).
2.  **CRUD Functions**: Implement the core Create, Read, Update, and Delete logic for each resource. Initially, these will be public to allow for basic testing.

### Phase 3: Security Implementation
1.  **Password Hashing**: Implement password hashing functions in `app/core/security.py`.
2.  **Authentication**: Create a `/login` endpoint that accepts a username/password, verifies credentials, and returns a JWT token.
3.  **Authorization**: Develop a FastAPI dependency that decodes the JWT token, retrieves the user, and checks their role. Secure all management endpoints using this dependency.

### Phase 4: Testing & Refinement
1.  **Setup Pytest**: Configure the project for testing with `pytest`.
2.  **Write Tests**: Implement integration tests using FastAPI's `TestClient`. The tests will cover the acceptance scenarios defined in `spec.md`, including successful CRUD operations, authorization failures, and edge cases.
3.  **Refine & Document**: Refine the code and ensure all endpoints are automatically documented by FastAPI's OpenAPI/Swagger UI.
