from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    admin = "admin"
    empleado = "empleado"


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    nombre_completo: str = Field(..., min_length=1, max_length=200)
    role: UserRole


class UpdateUserRequest(BaseModel):
    role: UserRole | None = None
    activo: bool | None = None
    nombre_completo: str | None = Field(default=None, min_length=1, max_length=200)


class UserResponse(BaseModel):
    id: UUID
    email: str
    nombre_completo: str
    role: str
    activo: bool
    created_at: datetime


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    page_size: int
