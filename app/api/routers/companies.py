from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any

from app.api import deps
from app.schemas.company import CompanyCreate, CompanyUpdate, Company # Changed from CompanyInDB
from app.db import models

router = APIRouter()

@router.post("/", response_model=Company) # Changed from CompanyInDB
def create_company(
    *,
    db: Session = Depends(deps.get_db),
    company_in: CompanyCreate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Create new company.
    """
    if current_user.role != models.UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Only super admins can create companies")
    db_obj = models.Company(**company_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[Company]) # Changed from CompanyInDB
def read_companies(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve companies.
    """
    query = db.query(models.Company)
    if current_user.role == models.UserRole.company_admin:
        query = query.filter(models.Company.id == current_user.company_id)
    companies = query.offset(skip).limit(limit).all()
    return companies

@router.get("/{company_id}", response_model=Company) # Changed from CompanyInDB
def read_company(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get company by ID.
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if current_user.role == models.UserRole.company_admin and company.id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this company")
    return company

@router.put("/{company_id}", response_model=Company) # Changed from CompanyInDB
def update_company(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    company_in: CompanyUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a company.
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if current_user.role == models.UserRole.company_admin and company.id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this company")
    if current_user.role == models.UserRole.super_admin or (current_user.role == models.UserRole.company_admin and company.id == current_user.company_id):
        update_data = company_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
    else:
        raise HTTPException(status_code=403, detail="Not authorized to update this company")

@router.delete("/{company_id}", response_model=Company) # Changed from CompanyInDB
def delete_company(
    *,
    db: Session = Depends(deps.get_db),
    company_id: int,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a company.
    """
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if current_user.role == models.UserRole.company_admin and company.id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this company")
    if current_user.role == models.UserRole.super_admin or (current_user.role == models.UserRole.company_admin and company.id == current_user.company_id):
        db.delete(company)
        db.commit()
        return company
    else:
        raise HTTPException(status_code=403, detail="Not authorized to delete this company")
