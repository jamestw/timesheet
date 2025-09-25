from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload # Import joinedload
from typing import Any, List
from datetime import datetime, date, time, timedelta

from app.api import deps
from app.db.models import AttendanceRecord, AttendanceType, AttendanceStatus, User, Company
from app.schemas.attendance import AttendanceRecord as AttendanceRecordSchema, AttendanceRequest
from app.db import models # Import models
from app.utils.geolocation import is_within_range

router = APIRouter()

def get_work_day_range(company: Company, current_time: datetime):
    """
    根據公司班別設定取得工作日的時間範圍
    對於跨日班別，需要特殊處理
    """
    if not company.is_overnight_shift:
        # 一般班別：當日 00:00 - 23:59
        day_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = current_time.replace(hour=23, minute=59, second=59, microsecond=999999)
        return day_start, day_end

    # 跨日班別邏輯
    work_start = company.work_start_time
    work_end = company.work_end_time

    if not work_start or not work_end:
        # 如果沒有設定工作時間，使用預設邏輯
        day_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = current_time.replace(hour=23, minute=59, second=59, microsecond=999999)
        return day_start, day_end

    current_time_only = current_time.time()

    # 判斷當前時間是在工作日的哪一部分
    if current_time_only >= work_start:  # 例如：現在是 23:30，工作開始時間是 23:00
        # 在工作日的開始部分 (今天23:00 - 明天06:00)
        day_start = current_time.replace(hour=work_start.hour, minute=work_start.minute, second=0, microsecond=0)
        day_end = (current_time + timedelta(days=1)).replace(hour=work_end.hour, minute=work_end.minute, second=59, microsecond=999999)
    else:  # 例如：現在是 05:30，工作結束時間是 06:00
        # 在工作日的結束部分 (昨天23:00 - 今天06:00)
        day_start = (current_time - timedelta(days=1)).replace(hour=work_start.hour, minute=work_start.minute, second=0, microsecond=0)
        day_end = current_time.replace(hour=work_end.hour, minute=work_end.minute, second=59, microsecond=999999)

    return day_start, day_end

def determine_attendance_status(
    company: Company,
    attendance_type: AttendanceType,
    current_time: datetime
) -> AttendanceStatus:
    """
    根據公司工作時間設定判斷考勤狀態
    """
    if not company.work_start_time or not company.work_end_time:
        return AttendanceStatus.normal

    current_time_only = current_time.time()

    if attendance_type == AttendanceType.check_in:
        # 計算允許的最晚上班時間
        work_start = company.work_start_time
        late_tolerance = company.late_tolerance_minutes or 0

        # 將時間轉換為分鐘進行計算
        work_start_minutes = work_start.hour * 60 + work_start.minute
        current_minutes = current_time_only.hour * 60 + current_time_only.minute
        allowed_late_minutes = work_start_minutes + late_tolerance

        if current_minutes > allowed_late_minutes:
            return AttendanceStatus.late
        else:
            return AttendanceStatus.normal

    elif attendance_type == AttendanceType.check_out:
        # 計算允許的最早下班時間
        work_end = company.work_end_time
        early_tolerance = company.early_leave_tolerance_minutes or 0

        # 將時間轉換為分鐘進行計算
        work_end_minutes = work_end.hour * 60 + work_end.minute
        current_minutes = current_time_only.hour * 60 + current_time_only.minute
        allowed_early_minutes = work_end_minutes - early_tolerance

        if current_minutes < allowed_early_minutes:
            return AttendanceStatus.early_leave
        else:
            return AttendanceStatus.normal

    return AttendanceStatus.normal

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
    distance_limit = float(company.attendance_distance_limit) if company.attendance_distance_limit else 100.0
    is_valid_location, distance = is_within_range(
        user_latitude, user_longitude,
        float(company.latitude) if company.latitude else None,
        float(company.longitude) if company.longitude else None,
        max_distance=distance_limit
    )

    if not is_valid_location:
        raise HTTPException(
            status_code=403,
            detail=f"您距離公司位置{distance:.1f}公尺。請在距離辦公室{distance_limit:.0f}公尺範圍內打卡。"
        )

    # Check if already checked in today (考慮跨日班別)
    current_time = datetime.now()
    work_day_start, work_day_end = get_work_day_range(company, current_time)

    today_check_in = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.record_type == AttendanceType.check_in,
        AttendanceRecord.record_time >= work_day_start,
        AttendanceRecord.record_time <= work_day_end
    ).first()

    if today_check_in:
        raise HTTPException(status_code=400, detail="今日已經上班打卡。")

    # Determine attendance status based on work schedule
    attendance_status = determine_attendance_status(
        company=company,
        attendance_type=AttendanceType.check_in,
        current_time=current_time
    )

    # Create attendance record
    attendance_record = AttendanceRecord(
        user_id=current_user.id,
        company_id=current_user.company_id,
        record_time=current_time,
        record_type=AttendanceType.check_in,
        latitude=user_latitude,
        longitude=user_longitude,
        status=attendance_status
    )
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    # 構建狀態消息
    status_message = "上班打卡成功"
    if attendance_status == AttendanceStatus.late:
        status_message = "上班打卡成功（遲到）"
    elif attendance_status == AttendanceStatus.normal:
        status_message = "上班打卡成功（準時）"

    return {
        "message": status_message,
        "record_id": attendance_record.id,
        "distance_from_company": round(distance, 1),
        "status": attendance_status.value,
        "record_time": current_time.isoformat()
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
    distance_limit = float(company.attendance_distance_limit) if company.attendance_distance_limit else 100.0
    is_valid_location, distance = is_within_range(
        user_latitude, user_longitude,
        float(company.latitude) if company.latitude else None,
        float(company.longitude) if company.longitude else None,
        max_distance=distance_limit
    )

    if not is_valid_location:
        raise HTTPException(
            status_code=403,
            detail=f"您距離公司位置{distance:.1f}公尺。請在距離辦公室{distance_limit:.0f}公尺範圍內打卡。"
        )

    # Check if already checked out today (考慮跨日班別)
    current_time = datetime.now()
    work_day_start, work_day_end = get_work_day_range(company, current_time)

    today_check_out = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.record_type == AttendanceType.check_out,
        AttendanceRecord.record_time >= work_day_start,
        AttendanceRecord.record_time <= work_day_end
    ).first()

    if today_check_out:
        raise HTTPException(status_code=400, detail="今日已經下班打卡。")

    # Determine attendance status based on work schedule
    attendance_status = determine_attendance_status(
        company=company,
        attendance_type=AttendanceType.check_out,
        current_time=current_time
    )

    # Create attendance record
    attendance_record = AttendanceRecord(
        user_id=current_user.id,
        company_id=current_user.company_id,
        record_time=current_time,
        record_type=AttendanceType.check_out,
        latitude=user_latitude,
        longitude=user_longitude,
        status=attendance_status
    )
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    # 構建狀態消息
    status_message = "下班打卡成功"
    if attendance_status == AttendanceStatus.early_leave:
        status_message = "下班打卡成功（早退）"
    elif attendance_status == AttendanceStatus.normal:
        status_message = "下班打卡成功（準時）"

    return {
        "message": status_message,
        "record_id": attendance_record.id,
        "distance_from_company": round(distance, 1),
        "status": attendance_status.value,
        "record_time": current_time.isoformat()
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

@router.post("/overtime-start", response_model=dict)
def overtime_start(
    *,
    db: Session = Depends(deps.get_db),
    attendance_request: AttendanceRequest,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Employee overtime start (clock-in) with location validation.
    """
    # Get user's location from request
    user_latitude = attendance_request.latitude
    user_longitude = attendance_request.longitude

    # Get company location
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="找不到公司資訊")

    # Validate location if company has coordinates set
    distance_limit = float(company.attendance_distance_limit) if company.attendance_distance_limit else 100.0
    is_valid_location, distance = is_within_range(
        user_latitude, user_longitude,
        float(company.latitude) if company.latitude else None,
        float(company.longitude) if company.longitude else None,
        max_distance=distance_limit
    )

    if not is_valid_location:
        raise HTTPException(
            status_code=403,
            detail=f"您距離公司位置{distance:.1f}公尺。請在距離辦公室{distance_limit:.0f}公尺範圍內打卡。"
        )

    # Check if already started overtime today (考慮跨日班別)
    current_time = datetime.now()
    work_day_start, work_day_end = get_work_day_range(company, current_time)

    today_overtime_start = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.record_type == AttendanceType.overtime_start,
        AttendanceRecord.record_time >= work_day_start,
        AttendanceRecord.record_time <= work_day_end
    ).first()

    if today_overtime_start:
        raise HTTPException(status_code=400, detail="今日已經開始加班打卡。")

    # Create attendance record
    current_time = datetime.now()
    attendance_record = AttendanceRecord(
        user_id=current_user.id,
        company_id=current_user.company_id,
        record_time=current_time,
        record_type=AttendanceType.overtime_start,
        latitude=user_latitude,
        longitude=user_longitude,
        status=AttendanceStatus.normal
    )
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    return {
        "message": "加班開始打卡成功",
        "record_id": attendance_record.id,
        "distance_from_company": round(distance, 1),
        "status": "normal",
        "record_time": current_time.isoformat()
    }

@router.post("/overtime-end", response_model=dict)
def overtime_end(
    *,
    db: Session = Depends(deps.get_db),
    attendance_request: AttendanceRequest,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Employee overtime end (clock-out) with location validation.
    """
    # Get user's location from request
    user_latitude = attendance_request.latitude
    user_longitude = attendance_request.longitude

    # Get company location
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="找不到公司資訊")

    # Validate location if company has coordinates set
    distance_limit = float(company.attendance_distance_limit) if company.attendance_distance_limit else 100.0
    is_valid_location, distance = is_within_range(
        user_latitude, user_longitude,
        float(company.latitude) if company.latitude else None,
        float(company.longitude) if company.longitude else None,
        max_distance=distance_limit
    )

    if not is_valid_location:
        raise HTTPException(
            status_code=403,
            detail=f"您距離公司位置{distance:.1f}公尺。請在距離辦公室{distance_limit:.0f}公尺範圍內打卡。"
        )

    # Check if overtime started today (考慮跨日班別)
    current_time = datetime.now()
    work_day_start, work_day_end = get_work_day_range(company, current_time)

    today_overtime_start = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.record_type == AttendanceType.overtime_start,
        AttendanceRecord.record_time >= work_day_start,
        AttendanceRecord.record_time <= work_day_end
    ).first()

    if not today_overtime_start:
        raise HTTPException(status_code=400, detail="今日尚未開始加班，無法結束加班。")

    # Check if already ended overtime today
    today_overtime_end = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.record_type == AttendanceType.overtime_end,
        AttendanceRecord.record_time >= work_day_start,
        AttendanceRecord.record_time <= work_day_end
    ).first()

    if today_overtime_end:
        raise HTTPException(status_code=400, detail="今日已經結束加班打卡。")

    # Create attendance record
    attendance_record = AttendanceRecord(
        user_id=current_user.id,
        company_id=current_user.company_id,
        record_time=current_time,
        record_type=AttendanceType.overtime_end,
        latitude=user_latitude,
        longitude=user_longitude,
        status=AttendanceStatus.normal
    )
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)

    return {
        "message": "加班結束打卡成功",
        "record_id": attendance_record.id,
        "distance_from_company": round(distance, 1),
        "status": "normal",
        "record_time": current_time.isoformat()
    }