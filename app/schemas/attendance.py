from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.db.models import AttendanceType, AttendanceStatus
from app.schemas.user import User # Import User schema
from app.schemas.company import Company # Import Company schema

class AttendanceRequest(BaseModel):
    latitude: float
    longitude: float

class AttendanceRecordBase(BaseModel):
    record_time: datetime
    record_type: AttendanceType
    status: AttendanceStatus
    latitude: float | None = None
    longitude: float | None = None

class AttendanceRecord(AttendanceRecordBase):
    id: int
    user: User # Add user details
    company: Company # Add company details

    model_config = {"from_attributes": True}