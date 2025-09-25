from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any

from app.api import deps
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentInDB
from app.db import models

router = APIRouter()

@router.post("", response_model=DepartmentInDB)
def create_department(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    department_in: DepartmentCreate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Create new department for a company.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to create departments for this company")
    db_obj = models.Department(**department_in.model_dump(), company_id=company_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("", response_model=List[DepartmentInDB])
def read_departments(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve departments for a company.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view departments for this company")
    departments = db.query(models.Department).filter(models.Department.company_id == company_id).offset(skip).limit(limit).all()
    return departments

@router.get("/{department_id}", response_model=DepartmentInDB)
def read_department(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    department_id: int,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get department by ID.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view departments for this company")
    department = db.query(models.Department).filter(models.Department.company_id == company_id, models.Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.put("/{department_id}", response_model=DepartmentInDB)
def update_department(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    department_id: int,
    department_in: DepartmentUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a department.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to update departments for this company")
    department = db.query(models.Department).filter(models.Department.company_id == company_id, models.Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    update_data = department_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(department, field, value)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department

@router.delete("/{department_id}", response_model=DepartmentInDB)
def delete_department(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    department_id: int,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a department.
    """
    if current_user.role == models.UserRole.company_admin and company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete departments for this company")
    department = db.query(models.Department).filter(models.Department.company_id == company_id, models.Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(department)
    db.commit()
    return department