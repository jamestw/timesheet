from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload # Import joinedload
from typing import Any, List
from datetime import datetime, date

from app.api import deps
from app.db.models import AttendanceRecord, AttendanceType, AttendanceStatus, User, Company
from app.schemas.attendance import AttendanceRecord as AttendanceRecordSchema, AttendanceRequest
from app.db import models # Import models
from app.utils.geolocation import is_within_range

router = APIRouter()

@router.post("/check-in", response_model=dict)
def check_in(
    *,
    db: Session = Depends(deps.get_db),
    attendance_request: AttendanceRequest,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Employee check-in (clock-in) with location validation.
    """
    # Get user's location from request
    user_latitude = attendance_request.latitude
    user_longitude = attendance_request.longitude

    # Get company location
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Validate location if company has coordinates set
    is_valid_location, distance = is_within_range(
        user_latitude, user_longitude,
        float(company.latitude) if company.latitude else None,
        float(company.longitude) if company.longitude else None,
        max_distance=100.0  # 100 meters
    )

    if not is_valid_location:
        raise HTTPException(
            status_code=403,
            detail=f"You are {distance:.1f}m away from the company location. Please check-in within 100m of the office."
        )

    # Check if already checked in today
    today_check_in = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.record_type == AttendanceType.check_in,
        AttendanceRecord.record_time >= datetime.now().date()
    ).first()

    if today_check_in:
        raise HTTPException(status_code=400, detail="Already checked in today.")

    # Create attendance record
    attendance_record = AttendanceRecord(
        user_id=current_user.id,
        company_id=current_user.company_id,
        record_time=datetime.now(),
        record_type=AttendanceType.check_in,
        latitude=user_latitude,
        longitude=user_longitude,
        status=AttendanceStatus.normal
    )
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    return {
        "message": "Check-in successful",
        "record_id": attendance_record.id,
        "distance_from_company": round(distance, 1)
    }

@router.post("/check-out", response_model=dict)
def check_out(
    *,
    db: Session = Depends(deps.get_db),
    attendance_request: AttendanceRequest,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Employee check-out (clock-out) with location validation.
    """
    # Get user's location from request
    user_latitude = attendance_request.latitude
    user_longitude = attendance_request.longitude

    # Get company location
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Validate location if company has coordinates set
    is_valid_location, distance = is_within_range(
        user_latitude, user_longitude,
        float(company.latitude) if company.latitude else None,
        float(company.longitude) if company.longitude else None,
        max_distance=100.0  # 100 meters
    )

    if not is_valid_location:
        raise HTTPException(
            status_code=403,
            detail=f"You are {distance:.1f}m away from the company location. Please check-out within 100m of the office."
        )

    # Check if already checked out today
    today_check_out = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.record_type == AttendanceType.check_out,
        AttendanceRecord.record_time >= datetime.now().date()
    ).first()

    if today_check_out:
        raise HTTPException(status_code=400, detail="Already checked out today.")

    # Create attendance record
    attendance_record = AttendanceRecord(
        user_id=current_user.id,
        company_id=current_user.company_id,
        record_time=datetime.now(),
        record_type=AttendanceType.check_out,
        latitude=user_latitude,
        longitude=user_longitude,
        status=AttendanceStatus.normal
    )
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    return {
        "message": "Check-out successful",
        "record_id": attendance_record.id,
        "distance_from_company": round(distance, 1)
    }

@router.get("/records", response_model=List[AttendanceRecordSchema])
def get_attendance_records(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    company_id: int | None = None,
    department_id: int | None = None,
    user_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve attendance records with filtering options.
    Super admins can view all records. Company admins can view records for their company.
    """
    print(f"Current User ID: {current_user.id}, Role: {current_user.role}, Company ID: {current_user.company_id}, Department ID: {current_user.department_id}")
    print(f"Params - Company ID: {company_id}, Department ID: {department_id}, User ID: {user_id}, Start Date: {start_date}, End Date: {end_date}")

    query = db.query(AttendanceRecord).options(joinedload(AttendanceRecord.user), joinedload(AttendanceRecord.company))

    # Role-based access control
    if current_user.role == models.UserRole.company_admin:
        # Company admins can only see records for their company
        query = query.filter(AttendanceRecord.company_id == current_user.company_id)
        # If company_id is provided by a company admin, ensure it matches their company_id
        if company_id is not None and company_id != current_user.company_id:
            print("403: Not authorized to view records for this company (company_admin)")
            raise HTTPException(status_code=403, detail="Not authorized to view records for this company")
    elif current_user.role == models.UserRole.employee or current_user.role == models.UserRole.department_head:
        # Employees and department heads can only see their own records
        query = query.filter(AttendanceRecord.user_id == current_user.id)
        # If any filter is provided by an employee/department head, it must match their own data
        if company_id is not None and company_id != current_user.company_id:
            print("403: Not authorized to view records for this company (employee/department_head)")
            raise HTTPException(status_code=403, detail="Not authorized to view records for this company")
        if department_id is not None and department_id != current_user.department_id:
            print("403: Not authorized to view records for this department (employee/department_head)")
            raise HTTPException(status_code=403, detail="Not authorized to view records for this department")
        if user_id is not None and user_id != current_user.id:
            print("403: Not authorized to view records for other users (employee/department_head)")
            raise HTTPException(status_code=403, detail="Not authorized to view records for other users")

    # Apply filters
    if company_id is not None:
        query = query.filter(AttendanceRecord.company_id == company_id)
    if department_id is not None:
        # Need to join with User table to filter by department_id
        query = query.join(models.User).filter(models.User.department_id == department_id)
    if user_id is not None:
        query = query.filter(AttendanceRecord.user_id == user_id)
    if start_date:
        query = query.filter(AttendanceRecord.record_time >= start_date)
    if end_date:
        query = query.filter(AttendanceRecord.record_time < datetime.combine(end_date, datetime.max.time()))

    records = query.order_by(AttendanceRecord.record_time.desc()).offset(skip).limit(limit).all()
    return records