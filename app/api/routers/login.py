from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from app.api import deps
from app.core.security import create_access_token, verify_password
from app.db.models import User as DBUser
from app.schemas.user import User

router = APIRouter()

@router.post("/login/access-token")
def login_access_token(db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    print(f"\n=== LOGIN ATTEMPT ===")
    print(f"Username: {form_data.username}")

    user = db.query(DBUser).filter(DBUser.email == form_data.username).first()

    if not user:
        print("[ERROR] User not found")
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"[SUCCESS] User found: ID={user.id}, Email={user.email}")

    if not verify_password(form_data.password, user.hashed_password):
        print("[ERROR] Password verification failed")
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print("[SUCCESS] Password verified")

    if not user.is_active:
        print("[ERROR] User is inactive")
        raise HTTPException(status_code=400, detail="Inactive user")

    print("[SUCCESS] User is active")

    access_token = create_access_token(subject=user.id)
    print(f"[SUCCESS] Token created for user ID: {user.id}")
    print("=== LOGIN SUCCESS ===\n")

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User)
def read_user_me(
    current_user: DBUser = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    print(f"\n=== GET /users/me ===")
    print(f"User ID: {current_user.id}")
    print(f"User Email: {current_user.email}")
    print(f"User Role: {current_user.role}")
    print("=== END /users/me ===\n")

    return current_user