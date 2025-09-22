from datetime import datetime, date, timedelta
from typing import List, Optional, Any, Dict
from calendar import monthrange
import calendar

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract, case

from app.api import deps
from app.db.models import AttendanceRecord, User, Company, AttendanceType, AttendanceStatus
from app.schemas.user import User as UserSchema

router = APIRouter()


@router.get("/monthly-summary", response_model=List[Dict[str, Any]])
def get_monthly_attendance_summary(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    year: int = Query(..., description="年份"),
    month: int = Query(..., description="月份 (1-12)"),
    company_id: Optional[int] = Query(None, description="公司ID (super_admin可選其他公司)")
) -> Any:
    """
    獲取月度員工出勤統計
    包含：員工姓名、出勤次數、加班時數
    """

    # 權限檢查
    if current_user.role not in ["super_admin", "company_admin"]:
        raise HTTPException(status_code=403, detail="沒有權限查看報表")

    # 設定查詢的公司
    if current_user.role == "super_admin" and company_id:
        target_company_id = company_id
    else:
        target_company_id = current_user.company_id

    # 計算月份範圍
    first_day = date(year, month, 1)
    last_day = date(year, month, monthrange(year, month)[1])

    # 查詢該公司該月份的所有出勤記錄
    query = db.query(
        User.id.label('user_id'),
        func.concat(User.first_name, ' ', User.last_name).label('user_name'),
        User.email.label('user_email'),
        func.count(
            case(
                (AttendanceRecord.record_type == AttendanceType.check_in, 1),
                else_=None
            )
        ).label('check_in_count'),
        func.count(
            case(
                (AttendanceRecord.record_type == AttendanceType.check_out, 1),
                else_=None
            )
        ).label('check_out_count'),
        func.count(
            case(
                (AttendanceRecord.record_type == AttendanceType.overtime_start, 1),
                else_=None
            )
        ).label('overtime_start_count'),
        func.count(
            case(
                (AttendanceRecord.record_type == AttendanceType.overtime_end, 1),
                else_=None
            )
        ).label('overtime_end_count')
    ).join(
        AttendanceRecord, User.id == AttendanceRecord.user_id, isouter=True
    ).filter(
        User.company_id == target_company_id,
        User.is_active == True,
        or_(
            AttendanceRecord.record_time == None,
            and_(
                func.date(AttendanceRecord.record_time) >= first_day,
                func.date(AttendanceRecord.record_time) <= last_day
            )
        )
    ).group_by(User.id, User.first_name, User.last_name, User.email)

    results = query.all()

    # 計算加班時數
    summary_data = []
    for result in results:
        user_id = result.user_id

        # 計算加班時數 - 查詢該用戶的加班記錄
        overtime_records = db.query(AttendanceRecord).filter(
            AttendanceRecord.user_id == user_id,
            func.date(AttendanceRecord.record_time) >= first_day,
            func.date(AttendanceRecord.record_time) <= last_day,
            AttendanceRecord.record_type.in_([AttendanceType.overtime_start, AttendanceType.overtime_end])
        ).order_by(AttendanceRecord.record_time).all()

        # 計算配對的加班時數
        overtime_hours = calculate_overtime_hours(overtime_records)

        # 計算出勤天數（有check_in或check_out的天數）
        attendance_days = db.query(
            func.count(func.distinct(func.date(AttendanceRecord.record_time)))
        ).filter(
            AttendanceRecord.user_id == user_id,
            func.date(AttendanceRecord.record_time) >= first_day,
            func.date(AttendanceRecord.record_time) <= last_day,
            AttendanceRecord.record_type.in_([AttendanceType.check_in, AttendanceType.check_out])
        ).scalar() or 0

        summary_data.append({
            "user_id": user_id,
            "user_name": result.user_name,
            "user_email": result.user_email,
            "attendance_days": attendance_days,
            "check_in_count": result.check_in_count,
            "check_out_count": result.check_out_count,
            "overtime_hours": round(overtime_hours, 2),
            "overtime_sessions": result.overtime_start_count
        })

    return summary_data


@router.get("/individual-record", response_model=Dict[str, Any])
def get_individual_attendance_record(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    user_id: int = Query(..., description="員工ID"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., description="月份 (1-12)")
) -> Any:
    """
    獲取個人出勤紀錄表
    按照標準出勤表格式，包含每日上下班時間、加班時間等
    """

    # 權限檢查
    if current_user.role not in ["super_admin", "company_admin"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="沒有權限查看此員工記錄")

    # 查詢目標用戶
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="員工不存在")

    # 如果是公司管理員，確保只能查看同公司員工
    if current_user.role == "company_admin" and target_user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="沒有權限查看其他公司員工記錄")

    # 計算月份範圍
    first_day = date(year, month, 1)
    last_day = date(year, month, monthrange(year, month)[1])

    # 查詢該員工該月份的所有出勤記錄
    attendance_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == user_id,
        func.date(AttendanceRecord.record_time) >= first_day,
        func.date(AttendanceRecord.record_time) <= last_day
    ).order_by(AttendanceRecord.record_time).all()

    # 按日期組織數據
    daily_records = {}
    for record in attendance_records:
        record_date = record.record_time.date()
        if record_date not in daily_records:
            daily_records[record_date] = {
                "date": record_date,
                "weekday": calendar.day_name[record_date.weekday()],
                "weekday_zh": get_chinese_weekday(record_date.weekday()),
                "check_in": None,
                "check_out": None,
                "overtime_start": None,
                "overtime_end": None,
                "work_hours": 0,
                "overtime_hours": 0
            }

        if record.record_type == AttendanceType.check_in:
            daily_records[record_date]["check_in"] = record.record_time.strftime("%H:%M")
        elif record.record_type == AttendanceType.check_out:
            daily_records[record_date]["check_out"] = record.record_time.strftime("%H:%M")
        elif record.record_type == AttendanceType.overtime_start:
            daily_records[record_date]["overtime_start"] = record.record_time.strftime("%H:%M")
        elif record.record_type == AttendanceType.overtime_end:
            daily_records[record_date]["overtime_end"] = record.record_time.strftime("%H:%M")

    # 計算工作時數和加班時數
    for date_key, day_data in daily_records.items():
        # 計算正常工作時數
        if day_data["check_in"] and day_data["check_out"]:
            check_in_time = datetime.strptime(day_data["check_in"], "%H:%M").time()
            check_out_time = datetime.strptime(day_data["check_out"], "%H:%M").time()

            check_in_datetime = datetime.combine(date_key, check_in_time)
            check_out_datetime = datetime.combine(date_key, check_out_time)

            # 如果下班時間小於上班時間，說明跨天了
            if check_out_time < check_in_time:
                check_out_datetime += timedelta(days=1)

            work_duration = check_out_datetime - check_in_datetime
            day_data["work_hours"] = round(work_duration.total_seconds() / 3600, 2)

        # 計算加班時數
        if day_data["overtime_start"] and day_data["overtime_end"]:
            overtime_start_time = datetime.strptime(day_data["overtime_start"], "%H:%M").time()
            overtime_end_time = datetime.strptime(day_data["overtime_end"], "%H:%M").time()

            overtime_start_datetime = datetime.combine(date_key, overtime_start_time)
            overtime_end_datetime = datetime.combine(date_key, overtime_end_time)

            # 如果加班結束時間小於開始時間，說明跨天了
            if overtime_end_time < overtime_start_time:
                overtime_end_datetime += timedelta(days=1)

            overtime_duration = overtime_end_datetime - overtime_start_datetime
            day_data["overtime_hours"] = round(overtime_duration.total_seconds() / 3600, 2)

    # 建立完整月份的記錄（包含沒有出勤記錄的日期）
    monthly_records = []
    current_date = first_day

    while current_date <= last_day:
        weekday = current_date.weekday()
        # 只排除周末，但如果有加班記錄則保留
        is_weekend = weekday in [5, 6]  # 5=Saturday, 6=Sunday

        if current_date in daily_records:
            # 有記錄的日期
            record = daily_records[current_date]
            monthly_records.append(record)
        elif not is_weekend:
            # 工作日但沒有記錄
            monthly_records.append({
                "date": current_date,
                "weekday": calendar.day_name[weekday],
                "weekday_zh": get_chinese_weekday(weekday),
                "check_in": None,
                "check_out": None,
                "overtime_start": None,
                "overtime_end": None,
                "work_hours": 0,
                "overtime_hours": 0
            })
        elif is_weekend and current_date in daily_records and (
            daily_records[current_date]["overtime_start"] or daily_records[current_date]["overtime_end"]
        ):
            # 周末但有加班記錄
            record = daily_records[current_date]
            monthly_records.append(record)

        current_date += timedelta(days=1)

    # 計算月度統計
    total_work_hours = sum(record["work_hours"] for record in monthly_records)
    total_overtime_hours = sum(record["overtime_hours"] for record in monthly_records)
    total_attendance_days = len([record for record in monthly_records if record["check_in"]])

    # 獲取用戶和公司信息
    company = db.query(Company).filter(Company.id == target_user.company_id).first()

    return {
        "user_info": {
            "id": target_user.id,
            "name": f"{target_user.first_name} {target_user.last_name}",
            "email": target_user.email,
            "company_name": company.name if company else "",
            "department_name": target_user.department.name if target_user.department else ""
        },
        "period": {
            "year": year,
            "month": month,
            "month_name": calendar.month_name[month]
        },
        "daily_records": monthly_records,
        "summary": {
            "total_work_hours": round(total_work_hours, 2),
            "total_overtime_hours": round(total_overtime_hours, 2),
            "total_attendance_days": total_attendance_days,
            "total_records": len(monthly_records)
        }
    }


def calculate_overtime_hours(overtime_records: List[AttendanceRecord]) -> float:
    """計算加班時數，將start和end記錄配對"""
    overtime_hours = 0.0
    start_record = None

    for record in overtime_records:
        if record.record_type == AttendanceType.overtime_start:
            start_record = record
        elif record.record_type == AttendanceType.overtime_end and start_record:
            # 計算加班時數
            duration = record.record_time - start_record.record_time
            overtime_hours += duration.total_seconds() / 3600
            start_record = None

    return overtime_hours


def get_chinese_weekday(weekday: int) -> str:
    """轉換星期幾為中文"""
    weekdays = ["一", "二", "三", "四", "五", "六", "日"]
    return weekdays[weekday]