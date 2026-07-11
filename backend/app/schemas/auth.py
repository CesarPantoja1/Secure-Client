from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginResponse(BaseModel):
    success: bool
    message: str


class AuthContext(BaseModel):
    user_id: str
    tenant_id: str | None = None
    email: str
    role: str
