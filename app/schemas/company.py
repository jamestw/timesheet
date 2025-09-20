from pydantic import BaseModel, ConfigDict
from typing import Optional
from decimal import Decimal

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
