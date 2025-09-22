from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.db.models import LeaveType, LeaveStatus
from app.schemas.user import User
from app.schemas.company import Company


# 請假申請創建Schema
class LeaveApplicationCreate(BaseModel):
    leave_type: LeaveType
    start_date: datetime
    end_date: datetime
    reason: str


# 請假申請更新Schema
class LeaveApplicationUpdate(BaseModel):
    leave_type: Optional[LeaveType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reason: Optional[str] = None


# 請假審核Schema
class LeaveApplicationReview(BaseModel):
    status: LeaveStatus
    review_comment: Optional[str] = None


# 請假申請響應Schema
class LeaveApplication(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    company_id: int
    leave_type: LeaveType
    start_date: datetime
    end_date: datetime
    reason: str
    status: LeaveStatus
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# 包含用戶和公司信息的完整Schema
class LeaveApplicationWithDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: User
    company: Company
    leave_type: LeaveType
    start_date: datetime
    end_date: datetime
    reason: str
    status: LeaveStatus
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# 請假類型列表Schema
class LeaveTypeInfo(BaseModel):
    value: str
    label: str


# 請假統計Schema
class LeaveStatistics(BaseModel):
    total_applications: int
    pending_applications: int
    approved_applications: int
    rejected_applications: int
    cancelled_applications: int