from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Any, List, Optional
from datetime import datetime, date

from app.api import deps
from app.db.models import LeaveApplication, LeaveType, LeaveStatus, User, Company
from app.schemas.leave import (
    LeaveApplicationCreate,
    LeaveApplicationUpdate,
    LeaveApplicationReview,
    LeaveApplication as LeaveApplicationSchema,
    LeaveApplicationWithDetails,
    LeaveTypeInfo,
    LeaveStatistics
)
from app.db import models

router = APIRouter()


@router.post("/", response_model=LeaveApplicationSchema)
def create_leave_application(
    *,
    db: Session = Depends(deps.get_db),
    leave_in: LeaveApplicationCreate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Create new leave application.
    """
    # 驗證日期邏輯
    if leave_in.start_date >= leave_in.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    # 檢查是否有重疊的請假申請
    overlapping_leave = db.query(LeaveApplication).filter(
        LeaveApplication.user_id == current_user.id,
        LeaveApplication.status.in_([LeaveStatus.pending, LeaveStatus.approved]),
        LeaveApplication.start_date <= leave_in.end_date,
        LeaveApplication.end_date >= leave_in.start_date
    ).first()

    if overlapping_leave:
        raise HTTPException(
            status_code=400,
            detail="Leave application overlaps with existing leave request"
        )

    # 創建請假申請
    leave_application = LeaveApplication(
        user_id=current_user.id,
        company_id=current_user.company_id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        reason=leave_in.reason,
        status=LeaveStatus.pending
    )

    db.add(leave_application)
    db.commit()
    db.refresh(leave_application)

    return leave_application


@router.get("/", response_model=List[LeaveApplicationWithDetails])
def get_leave_applications(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status: Optional[LeaveStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve leave applications with filtering options.
    """
    query = db.query(LeaveApplication).options(
        joinedload(LeaveApplication.user),
        joinedload(LeaveApplication.company)
    )

    # 權限控制
    if current_user.role == models.UserRole.employee:
        # 員工只能查看自己的請假申請
        query = query.filter(LeaveApplication.user_id == current_user.id)
    elif current_user.role == models.UserRole.department_head:
        # 部門主管可以查看自己部門的請假申請
        query = query.join(models.User).filter(
            models.User.department_id == current_user.department_id
        )
    elif current_user.role == models.UserRole.company_admin:
        # 公司管理員可以查看自己公司的所有請假申請
        query = query.filter(LeaveApplication.company_id == current_user.company_id)
    # super_admin 可以查看所有請假申請

    # 應用過濾條件
    if company_id:
        if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this company's leaves")
        query = query.filter(LeaveApplication.company_id == company_id)

    if user_id:
        if current_user.role == models.UserRole.employee and user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view other users' leaves")
        query = query.filter(LeaveApplication.user_id == user_id)

    if status:
        query = query.filter(LeaveApplication.status == status)

    if start_date:
        query = query.filter(LeaveApplication.start_date >= start_date)

    if end_date:
        query = query.filter(LeaveApplication.end_date <= datetime.combine(end_date, datetime.max.time()))

    leaves = query.order_by(LeaveApplication.created_at.desc()).offset(skip).limit(limit).all()
    return leaves


@router.get("/types", response_model=List[LeaveTypeInfo])
def get_leave_types(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get all available leave types.
    """
    leave_types = [
        LeaveTypeInfo(value=LeaveType.sick_leave.value, label="病假"),
        LeaveTypeInfo(value=LeaveType.personal_leave.value, label="事假"),
        LeaveTypeInfo(value=LeaveType.annual_leave.value, label="年假"),
        LeaveTypeInfo(value=LeaveType.maternity_leave.value, label="產假"),
        LeaveTypeInfo(value=LeaveType.paternity_leave.value, label="陪產假"),
        LeaveTypeInfo(value=LeaveType.marriage_leave.value, label="婚假"),
        LeaveTypeInfo(value=LeaveType.bereavement_leave.value, label="喪假"),
        LeaveTypeInfo(value=LeaveType.other.value, label="其他"),
    ]
    return leave_types


@router.get("/{leave_id}", response_model=LeaveApplicationWithDetails)
def get_leave_application(
    *,
    db: Session = Depends(deps.get_db),
    leave_id: int,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get leave application by ID.
    """
    leave = db.query(LeaveApplication).options(
        joinedload(LeaveApplication.user),
        joinedload(LeaveApplication.company)
    ).filter(LeaveApplication.id == leave_id).first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    # 權限檢查
    if current_user.role == models.UserRole.employee and leave.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this leave application")
    elif current_user.role == models.UserRole.company_admin and leave.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this leave application")

    return leave


@router.put("/{leave_id}", response_model=LeaveApplicationSchema)
def update_leave_application(
    *,
    db: Session = Depends(deps.get_db),
    leave_id: int,
    leave_in: LeaveApplicationUpdate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Update leave application. Only the applicant can update pending applications.
    """
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    # 只有申請人可以修改，且只能修改待審核的申請
    if leave.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this leave application")

    if leave.status != LeaveStatus.pending:
        raise HTTPException(status_code=400, detail="Cannot update leave application that is not pending")

    # 更新字段
    update_data = leave_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(leave, field, value)

    # 如果更新了日期，需要重新驗證
    if "start_date" in update_data or "end_date" in update_data:
        if leave.start_date >= leave.end_date:
            raise HTTPException(status_code=400, detail="Start date must be before end date")

        # 檢查重疊（排除自己）
        overlapping_leave = db.query(LeaveApplication).filter(
            LeaveApplication.user_id == current_user.id,
            LeaveApplication.id != leave_id,
            LeaveApplication.status.in_([LeaveStatus.pending, LeaveStatus.approved]),
            LeaveApplication.start_date <= leave.end_date,
            LeaveApplication.end_date >= leave.start_date
        ).first()

        if overlapping_leave:
            raise HTTPException(
                status_code=400,
                detail="Leave application overlaps with existing leave request"
            )

    db.add(leave)
    db.commit()
    db.refresh(leave)

    return leave


@router.put("/{leave_id}/review", response_model=LeaveApplicationSchema)
def review_leave_application(
    *,
    db: Session = Depends(deps.get_db),
    leave_id: int,
    review_in: LeaveApplicationReview,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Review leave application. Only admins and department heads can review.
    """
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    # 權限檢查
    if current_user.role == models.UserRole.employee:
        raise HTTPException(status_code=403, detail="Not authorized to review leave applications")

    if current_user.role == models.UserRole.company_admin and leave.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to review this leave application")

    if current_user.role == models.UserRole.department_head:
        # 部門主管只能審核自己部門的申請
        leave_user = db.query(models.User).filter(models.User.id == leave.user_id).first()
        if leave_user.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Not authorized to review this leave application")

    if leave.status != LeaveStatus.pending:
        raise HTTPException(status_code=400, detail="Can only review pending leave applications")

    # 更新審核信息
    leave.status = review_in.status
    leave.reviewed_by = current_user.id
    leave.reviewed_at = datetime.now()
    if review_in.review_comment:
        leave.review_comment = review_in.review_comment

    db.add(leave)
    db.commit()
    db.refresh(leave)

    return leave


@router.delete("/{leave_id}", response_model=LeaveApplicationSchema)
def cancel_leave_application(
    *,
    db: Session = Depends(deps.get_db),
    leave_id: int,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Cancel leave application. Only the applicant can cancel.
    """
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    if leave.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this leave application")

    if leave.status not in [LeaveStatus.pending, LeaveStatus.approved]:
        raise HTTPException(status_code=400, detail="Cannot cancel this leave application")

    leave.status = LeaveStatus.cancelled
    db.add(leave)
    db.commit()
    db.refresh(leave)

    return leave



@router.get("/statistics", response_model=LeaveStatistics)
def get_leave_statistics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    company_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> Any:
    """
    Get leave application statistics.
    """
    query = db.query(LeaveApplication)

    # 權限控制
    if current_user.role == models.UserRole.employee:
        query = query.filter(LeaveApplication.user_id == current_user.id)
    elif current_user.role == models.UserRole.company_admin:
        query = query.filter(LeaveApplication.company_id == current_user.company_id)

    if company_id and current_user.role in [models.UserRole.super_admin, models.UserRole.company_admin]:
        if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        query = query.filter(LeaveApplication.company_id == company_id)

    if user_id and current_user.role != models.UserRole.employee:
        query = query.filter(LeaveApplication.user_id == user_id)

    total = query.count()
    pending = query.filter(LeaveApplication.status == LeaveStatus.pending).count()
    approved = query.filter(LeaveApplication.status == LeaveStatus.approved).count()
    rejected = query.filter(LeaveApplication.status == LeaveStatus.rejected).count()
    cancelled = query.filter(LeaveApplication.status == LeaveStatus.cancelled).count()

    return LeaveStatistics(
        total_applications=total,
        pending_applications=pending,
        approved_applications=approved,
        rejected_applications=rejected,
        cancelled_applications=cancelled
    )