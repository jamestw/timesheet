from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db import models
from app.core import security
from app.core.config import settings
from app.db.base import SessionLocal

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/api/v1/login/access-token"
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)) -> models.User:
    print(f"\n=== GET_CURRENT_USER ===")
    print(f"Token received: {token[:20]}...")

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload["sub"]
        print(f"Token decoded successfully, user_id: {token_data}")
    except JWTError as e:
        print(f"[ERROR] JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    except ValidationError as e:
        print(f"[ERROR] Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    user = db.query(models.User).filter(models.User.id == token_data).first()
    if not user:
        print(f"[ERROR] User with ID {token_data} not found in database")
        raise HTTPException(status_code=404, detail="User not found")

    print(f"[SUCCESS] User found: ID={user.id}, Email={user.email}")
    print("=== END GET_CURRENT_USER ===\n")
    return user

def get_current_active_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if current_user.role not in [models.UserRole.company_admin, models.UserRole.super_admin]:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges"
        )
    return current_user