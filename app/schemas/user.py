from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import date, datetime
from app.db.models import UserRole, Gender, UserStatus

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_number: Optional[str] = None  # 身分證字號
    employee_number: Optional[str] = None  # 員工編號

# Properties for user registration
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    id_number: Optional[str] = None  # 身分證字號
    employee_number: Optional[str] = None  # 員工編號
    company_tax_id: str  # 公司統編

# Properties to receive via API on creation (admin creates user)
class UserCreate(UserBase):
    username: str
    password: str
    company_id: int
    role: UserRole = UserRole.employee
    department_id: Optional[int] = None
    status: UserStatus = UserStatus.approved
    is_active: bool = True

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[int] = None
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

# Properties for user approval/rejection
class UserApproval(BaseModel):
    user_id: int
    status: UserStatus  # approved or rejected
    rejection_reason: Optional[str] = None
    department_id: Optional[int] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    company_id: Optional[int] = None
    company_tax_id: Optional[str] = None
    role: UserRole
    department_id: Optional[int] = None
    status: UserStatus
    is_active: bool
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

# Properties to return to client
class User(UserInDBBase):
    pass

# Properties for admin to see pending registrations
class UserPending(UserInDBBase):
    pass

# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
