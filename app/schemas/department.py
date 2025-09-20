from pydantic import BaseModel
from typing import Optional

# Schema for request body on creation
class DepartmentCreate(BaseModel):
    name: str
    manager_id: Optional[int] = None

# Schema for request body on update
class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    manager_id: Optional[int] = None

# Schema for response body
class DepartmentInDB(BaseModel):
    id: int
    name: str
    company_id: int
    manager_id: Optional[int] = None

    class Config:
        orm_mode = True
