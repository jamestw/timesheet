from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any

from app.api import deps
from app.schemas.user import UserRegister, User
from app.db import models
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/register", response_model=dict)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_data: UserRegister,
) -> Any:
    """
    Register a new user with pending status.
    """
    # Check if username already exists
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="使用者名稱已存在"
        )

    # Check if email already exists
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="電子郵件已被註冊"
        )

    # Check if company exists by tax_id
    company = db.query(models.Company).filter(models.Company.tax_id == user_data.company_tax_id).first()
    if not company:
        raise HTTPException(
            status_code=400,
            detail="公司統編不存在，請聯絡管理員"
        )

    # Create new user with pending status
    hashed_password = get_password_hash(user_data.password)
    db_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        gender=user_data.gender,
        birth_date=user_data.birth_date,
        address=user_data.address,
        emergency_contact_name=user_data.emergency_contact_name,
        emergency_contact_phone=user_data.emergency_contact_phone,
        id_number=user_data.id_number,
        employee_number=user_data.employee_number,
        company_tax_id=user_data.company_tax_id,
        company_id=company.id,  # Set company_id based on tax_id lookup
        role=models.UserRole.employee,
        status=models.UserStatus.pending,
        is_active=False
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "message": "註冊成功！您的申請已送出，請等候管理員審核。審核通過後，您將可以正常登入使用系統。",
        "status": "pending"
    }

@router.get("/pending-users", response_model=list[User])
def get_pending_users(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get all pending user registrations for admin approval.
    Only super_admin and company_admin can access this.
    """
    if current_user.role == models.UserRole.super_admin:
        # Super admin can see all pending users
        pending_users = db.query(models.User).filter(
            models.User.status == models.UserStatus.pending
        ).all()
    elif current_user.role == models.UserRole.company_admin:
        # Company admin can only see pending users for their company
        pending_users = db.query(models.User).filter(
            models.User.status == models.UserStatus.pending,
            models.User.company_tax_id == current_user.company.tax_id
        ).all()
    else:
        raise HTTPException(
            status_code=403,
            detail="只有管理員可以查看待審核用戶"
        )

    return pending_users

@router.post("/approve-user", response_model=dict)
def approve_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    department_id: int = None,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Approve a pending user registration.
    """
    # Get the pending user
    pending_user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.status == models.UserStatus.pending
    ).first()

    if not pending_user:
        raise HTTPException(
            status_code=404,
            detail="找不到待審核的用戶"
        )

    # Check if current user can approve this user
    if current_user.role == models.UserRole.company_admin:
        # Company admin can only approve users for their company
        if pending_user.company_tax_id != current_user.company.tax_id:
            raise HTTPException(
                status_code=403,
                detail="您只能審核本公司的用戶申請"
            )
    elif current_user.role != models.UserRole.super_admin:
        raise HTTPException(
            status_code=403,
            detail="只有管理員可以審核用戶申請"
        )

    # Get company by tax_id
    company = db.query(models.Company).filter(
        models.Company.tax_id == pending_user.company_tax_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=400,
            detail="公司不存在"
        )

    # Update user status (company_id already set during registration)
    pending_user.status = models.UserStatus.approved
    pending_user.is_active = True
    pending_user.approved_by = current_user.id
    pending_user.approved_at = models.func.now()

    if department_id:
        # Verify department belongs to the company
        department = db.query(models.Department).filter(
            models.Department.id == department_id,
            models.Department.company_id == company.id
        ).first()
        if department:
            pending_user.department_id = department_id

    db.commit()

    return {
        "message": f"用戶 {pending_user.username} 已審核通過",
        "user_id": pending_user.id
    }

@router.post("/reject-user", response_model=dict)
def reject_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    rejection_reason: str,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Reject a pending user registration.
    """
    # Get the pending user
    pending_user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.status == models.UserStatus.pending
    ).first()

    if not pending_user:
        raise HTTPException(
            status_code=404,
            detail="找不到待審核的用戶"
        )

    # Check if current user can reject this user
    if current_user.role == models.UserRole.company_admin:
        # Company admin can only reject users for their company
        if pending_user.company_tax_id != current_user.company.tax_id:
            raise HTTPException(
                status_code=403,
                detail="您只能審核本公司的用戶申請"
            )
    elif current_user.role != models.UserRole.super_admin:
        raise HTTPException(
            status_code=403,
            detail="只有管理員可以審核用戶申請"
        )

    # Update user status
    pending_user.status = models.UserStatus.rejected
    pending_user.rejection_reason = rejection_reason
    pending_user.approved_by = current_user.id
    pending_user.approved_at = models.func.now()

    db.commit()

    return {
        "message": f"用戶 {pending_user.username} 申請已拒絕",
        "user_id": pending_user.id
    }