from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any

from app.api import deps
from app.schemas.user import UserCreate, UserUpdate, User
from app.db import models
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    user_in: UserCreate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Create new user.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to create users for this company")
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    db_obj = models.User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=user_in.role,
        department_id=user_in.department_id,
        company_id=company_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[User])
def read_users(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve users for a company.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view users for this company")
    users = db.query(models.User).filter(models.User.company_id == company_id).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=User)
def read_user(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    user_id: int,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get user by ID.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view users for this company")
    user = db.query(models.User).filter(models.User.company_id == company_id, models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    user_id: int,
    user_in: UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a user.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to update users for this company")
    user = db.query(models.User).filter(models.User.company_id == company_id, models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]
    for field, value in update_data.items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    user_id: int,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a user.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete users for this company")
    user = db.query(models.User).filter(models.User.company_id == company_id, models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return user