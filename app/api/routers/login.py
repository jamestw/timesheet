from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
from pydantic import BaseModel

from app.api import deps
from app.core.security import create_access_token, create_refresh_token, verify_password, verify_token
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
    refresh_token = create_refresh_token(subject=user.id)
    print(f"[SUCCESS] Tokens created for user ID: {user.id}")
    print("=== LOGIN SUCCESS ===\n")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

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

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(deps.get_db)):
    """
    使用refresh token換取新的access token
    """
    try:
        print(f"\n=== REFRESH TOKEN REQUEST ===")
        print(f"Refresh token received: {request.refresh_token[:20]}...")

        # 驗證refresh token
        payload = verify_token(request.refresh_token)
        print(f"Token payload: {payload}")

        # 檢查token類型
        if payload.get("type") != "refresh":
            print("[ERROR] Invalid token type")
            raise HTTPException(
                status_code=400,
                detail="無效的refresh token"
            )

        user_id = payload.get("sub")
        if not user_id:
            print("[ERROR] No user ID in token")
            raise HTTPException(
                status_code=400,
                detail="無效的token payload"
            )

        # 驗證用戶是否存在且活躍
        user = db.query(DBUser).filter(DBUser.id == int(user_id)).first()
        if not user or not user.is_active:
            print(f"[ERROR] User not found or inactive: {user_id}")
            raise HTTPException(
                status_code=400,
                detail="用戶不存在或已停用"
            )

        # 生成新的access token
        new_access_token = create_access_token(subject=user.id)
        print(f"[SUCCESS] New access token generated for user: {user.id}")
        print("=== REFRESH TOKEN SUCCESS ===\n")

        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }

    except ValueError as e:
        print(f"[ERROR] Token validation failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Token更新失敗"
        )