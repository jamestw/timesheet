# Tasks: Core Backend API - Phase 1

**Plan**: `plan.md`  
**Status**: To-Do

This list breaks down the implementation plan into actionable tasks. 

### Phase 1: Project & Database Setup
- [ ] **Task-001**: Initialize a new Python project with a virtual environment.
- [ ] **Task-002**: Create `requirements.txt` and add initial dependencies: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg2-binary`, `pydantic`, `passlib[bcrypt]`.
- [ ] **Task-003**: Create the initial project directory structure as defined in `plan.md` (`app/api/routers`, `app/core`, `app/db`, `app/schemas`).
- [ ] **Task-004**: Implement the `Company` SQLAlchemy model in `app/db/models.py`.
- [ ] **Task-005**: Implement the `Department` SQLAlchemy model in `app/db/models.py`.
- [ ] **Task-006**: Implement the `User` SQLAlchemy model in `app/db/models.py`, including the `user_role` ENUM type.
- [ ] **Task-007**: Define Pydantic schemas for the Company resource (e.g., `CompanyCreate`, `CompanyUpdate`, `CompanyInDB`) in `app/schemas/company.py`.
- [ ] **Task-008**: Define Pydantic schemas for the Department resource in `app/schemas/department.py`.
- [ ] **Task-009**: Define Pydantic schemas for the User resource in `app/schemas/user.py`, ensuring password fields are write-only.

### Phase 2: Core API Endpoint Implementation
- [ ] **Task-010**: Create the API router for `companies` in `app/api/routers/companies.py`.
- [ ] **Task-011**: Implement the five CRUD endpoints (Create, Read one, Read many, Update, Delete) for the companies router.
- [ ] **Task-012**: Create the API router for `departments` in `app/api/routers/departments.py`.
- [ ] **Task-013**: Implement the CRUD endpoints for the departments router, ensuring they are nested under a company.
- [ ] **Task-014**: Create the API router for `users` in `app/api/routers/users.py`.
- [ ] **Task-015**: Implement the CRUD endpoints for the users router, also nested under a company.

### Phase 3: Security Implementation
- [ ] **Task-016**: In `app/core/security.py`, implement `verify_password` and `get_password_hash` functions using `passlib`.
- [ ] **Task-017**: In `app/core/security.py`, implement `create_access_token` and token decoding functions for JWT.
- [ ] **Task-018**: Create a `/login/access-token` endpoint that authenticates a user and returns a JWT token.
- [ ] **Task-019**: Create a reusable FastAPI dependency (`get_current_active_admin`) that verifies the JWT token and ensures the user has the `company_admin` role.
- [ ] **Task-020**: Apply the `get_current_active_admin` dependency to all management endpoints created in Phase 2.

### Phase 4: Testing & Refinement
- [ ] **Task-021**: Install `pytest` and `httpx` for testing.
- [ ] **Task-022**: Set up the testing environment, including a separate test database configuration.
- [ ] **Task-023**: Write integration tests for the `/login/access-token` endpoint.
- [ ] **Task-024**: Write integration tests for the `companies` CRUD endpoints, covering success and failure cases.
- [ ] **Task-025**: Write integration tests for the `departments` CRUD endpoints.
- [ ] **Task-026**: Write integration tests for the `users` CRUD endpoints.
- [ ] **Task-027**: Write tests specifically for authorization, ensuring non-admin users are blocked (`403 Forbidden`).
- [ ] **Task-028**: Confirm that all API endpoints are correctly rendered in the auto-generated Swagger/OpenAPI documentation.
