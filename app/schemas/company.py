from pydantic import BaseModel, ConfigDict
from typing import Optional
from decimal import Decimal
from datetime import time

# Schema for request body on creation
class CompanyCreate(BaseModel):
    name: str
    tax_id: str  # 統一編號
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attendance_distance_limit: Optional[float] = 100.0  # 打卡距離限制(公尺)
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    # 工作時間設定
    work_start_time: Optional[time] = None
    work_end_time: Optional[time] = None
    late_tolerance_minutes: Optional[int] = 5
    early_leave_tolerance_minutes: Optional[int] = 0
    is_overnight_shift: Optional[bool] = False  # 是否為跨日班別

# Schema for request body on update
class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None  # 統一編號
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attendance_distance_limit: Optional[float] = None  # 打卡距離限制(公尺)
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    # 工作時間設定
    work_start_time: Optional[time] = None
    work_end_time: Optional[time] = None
    late_tolerance_minutes: Optional[int] = None
    early_leave_tolerance_minutes: Optional[int] = None
    is_overnight_shift: Optional[bool] = None  # 是否為跨日班別

# Schema for response body
class Company(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    tax_id: str  # 統一編號
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attendance_distance_limit: float = 100.0  # 打卡距離限制(公尺)
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    # 工作時間設定
    work_start_time: Optional[time] = None
    work_end_time: Optional[time] = None
    late_tolerance_minutes: Optional[int] = None
    early_leave_tolerance_minutes: Optional[int] = None
    is_overnight_shift: Optional[bool] = None  # 是否為跨日班別


# 專門用於工作時間設定的Schema
class WorkScheduleUpdate(BaseModel):
    work_start_time: time
    work_end_time: time
    late_tolerance_minutes: int = 5
    early_leave_tolerance_minutes: int = 0
    is_overnight_shift: bool = False  # 是否為跨日班別

class WorkSchedule(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    work_start_time: Optional[time] = None
    work_end_time: Optional[time] = None
    late_tolerance_minutes: Optional[int] = None
    early_leave_tolerance_minutes: Optional[int] = None
    is_overnight_shift: Optional[bool] = None  # 是否為跨日班別