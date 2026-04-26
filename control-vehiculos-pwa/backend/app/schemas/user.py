from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str | None = None
    email: str | None = None
    role: str = "OPERADOR"
    permissions: list[str] = []


class UserPermissionsUpdate(BaseModel):
    permissions: list[str]


# 🔐 Cambio de contraseña (ADMIN)
class UserPasswordReset(BaseModel):
    new_password: str


# 🔐 Marcar si el usuario debe cambiar contraseña
class UserRequirePasswordChange(BaseModel):
    must_change_password: bool


# 🔐 Solicitud desde login (IMPORTANTE)
class PasswordChangeRequestFromLogin(BaseModel):
    username: str


# 🔐 Recuperación por email
class ForgotPasswordRequest(BaseModel):
    email: str


# 🔐 Reset con token
class ResetPasswordWithTokenRequest(BaseModel):
    token: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    email: str | None = None
    role: str
    permissions: list[str] = []
    is_active: bool
    must_change_password: bool | None = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse