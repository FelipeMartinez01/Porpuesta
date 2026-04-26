from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str | None = None
    email: str | None = None
    role: str = "OPERADOR"


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    email: str | None = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse