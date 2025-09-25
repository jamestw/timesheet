from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean, DECIMAL, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class UserRole(str, enum.Enum):
    employee = "employee"
    department_head = "department_head"
    company_admin = "company_admin"
    super_admin = "super_admin"

class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class UserStatus(str, enum.Enum):
    pending = "pending"       # 待審核
    approved = "approved"     # 已審核通過
    rejected = "rejected"     # 審核拒絕
    inactive = "inactive"     # 停用

class AttendanceType(str, enum.Enum):
    check_in = "check_in"
    check_out = "check_out"
    overtime_start = "overtime_start"
    overtime_end = "overtime_end"

class AttendanceStatus(str, enum.Enum):
    normal = "normal"
    late = "late"
    early_leave = "early_leave"
    missing_check_in = "missing_check_in"
    missing_check_out = "missing_check_out"
    out_of_range = "out_of_range"

class LeaveType(str, enum.Enum):
    sick_leave = "sick_leave"        # 病假
    personal_leave = "personal_leave"  # 事假
    annual_leave = "annual_leave"    # 年假
    maternity_leave = "maternity_leave"  # 產假
    paternity_leave = "paternity_leave"  # 陪產假
    marriage_leave = "marriage_leave"    # 婚假
    bereavement_leave = "bereavement_leave"  # 喪假
    other = "other"                  # 其他

class LeaveStatus(str, enum.Enum):
    pending = "pending"      # 待審核
    approved = "approved"    # 已核准
    rejected = "rejected"    # 已拒絕
    cancelled = "cancelled"  # 已取消

class Company(Base):
    __tablename__ = 'companies'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tax_id = Column(String, unique=True, index=True, nullable=True)  # 統一編號
    address = Column(String)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    attendance_distance_limit = Column(DECIMAL(6, 2), nullable=False, default=100.0)  # 打卡距離限制(公尺)
    admin_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    contact_person = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    logo_url = Column(String)

    # 工作時間設定
    work_start_time = Column(Time, default='09:00:00')  # 上班時間
    work_end_time = Column(Time, default='18:00:00')    # 下班時間
    late_tolerance_minutes = Column(Integer, default=5)  # 遲到容忍時間(分鐘)
    early_leave_tolerance_minutes = Column(Integer, default=0)  # 早退容忍時間(分鐘)

    # 跨日班別設定
    is_overnight_shift = Column(Boolean, default=False)  # 是否為跨日班別 (如大夜班23:00-06:00)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    departments = relationship("Department", back_populates="company")
    users = relationship("User", back_populates="company", foreign_keys="[User.company_id]")
    attendance_records = relationship("AttendanceRecord", back_populates="company")
    leave_applications = relationship("LeaveApplication", back_populates="company")


class Department(Base):
    __tablename__ = 'departments'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    manager_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    company = relationship("Company", back_populates="departments")
    users = relationship("User", back_populates="department", foreign_keys="[User.department_id]")


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=True)  # 註冊時可能為空
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # 基本資料
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String)
    gender = Column(Enum(Gender))
    birth_date = Column(Date)
    address = Column(String)
    id_number = Column(String)  # 身分證字號
    employee_number = Column(String)  # 員工編號

    # 緊急聯絡人資料
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)

    # 公司相關
    company_tax_id = Column(String)  # 註冊時填入的公司統編
    role = Column(Enum(UserRole), nullable=False, default=UserRole.employee)
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL'))

    # 審核狀態
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.pending)
    approved_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(String)

    # 系統欄位
    is_active = Column(Boolean, default=False)  # 預設為 false，審核通過後才啟用
    last_login_at = Column(DateTime(timezone=True))
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    company = relationship("Company", back_populates="users", foreign_keys=[company_id])
    department = relationship("Department", back_populates="users", foreign_keys=[department_id])
    attendance_records = relationship("AttendanceRecord", back_populates="user")
    leave_applications = relationship("LeaveApplication", back_populates="user", foreign_keys="[LeaveApplication.user_id]")


class AttendanceRecord(Base):
    __tablename__ = 'attendance_records'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    record_time = Column(DateTime(timezone=True), nullable=False)
    record_type = Column(Enum(AttendanceType), nullable=False)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.normal)
    is_manual_correction = Column(Boolean, default=False)
    note = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="attendance_records")
    company = relationship("Company", back_populates="attendance_records")


class LeaveApplication(Base):
    __tablename__ = 'leave_applications'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.pending)

    # 審核相關
    reviewed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_comment = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="leave_applications", foreign_keys=[user_id])
    company = relationship("Company", back_populates="leave_applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
