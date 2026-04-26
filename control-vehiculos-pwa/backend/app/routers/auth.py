from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import secrets

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
)
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    UserPermissionsUpdate,
    UserPasswordReset,
    UserRequirePasswordChange,
    ForgotPasswordRequest,
    ResetPasswordWithTokenRequest,
    PasswordChangeRequestFromLogin,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    if payload.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="El email ya existe")

    valid_roles = {"ADMIN", "SUPERVISOR", "OPERADOR", "CONTROL_DOCUMENTO"}
    role = payload.role.upper()

    if role not in valid_roles:
        raise HTTPException(status_code=400, detail="Rol no válido")

    user = User(
        username=payload.username,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=role,
        permissions=payload.permissions or [],
        is_active=True,
        must_change_password=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    token = create_access_token(data={"sub": user.username, "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    return db.query(User).order_by(User.id.asc()).all()


@router.patch("/users/{user_id}/permissions", response_model=UserResponse)
def update_user_permissions(
    user_id: int,
    payload: UserPermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    valid_permissions = {
        "DASHBOARD_GENERAL",
        "DASHBOARD_BL",
        "ALERTAS",
    }

    for permission in payload.permissions:
        if permission not in valid_permissions:
            raise HTTPException(status_code=400, detail=f"Permiso no válido: {permission}")

    user.permissions = payload.permissions

    db.commit()
    db.refresh(user)

    return user


# 🔐 ADMIN CAMBIA CONTRASEÑA
@router.patch("/users/{user_id}/password", response_model=UserResponse)
def admin_change_user_password(
    user_id: int,
    payload: UserPasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if len(payload.new_password.strip()) < 6:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 6 caracteres",
        )

    user.hashed_password = hash_password(payload.new_password.strip())
    user.must_change_password = False
    user.reset_token = None
    user.reset_token_expires_at = None

    db.commit()
    db.refresh(user)

    return user


# 🔐 MARCAR CAMBIO DE CONTRASEÑA
@router.patch("/users/{user_id}/require-password-change", response_model=UserResponse)
def require_user_password_change(
    user_id: int,
    payload: UserRequirePasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.must_change_password = payload.must_change_password

    db.commit()
    db.refresh(user)

    return user


# 🔥 NUEVO: SOLICITUD DESDE LOGIN
@router.post("/request-password-change")
def request_password_change_from_login(
    payload: PasswordChangeRequestFromLogin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == payload.username).first()

    # No revelar si existe o no
    if not user:
        return {
            "message": "Si el usuario existe, se notificará al administrador"
        }

    user.must_change_password = True

    db.commit()

    return {
        "message": "Solicitud enviada. Un ADMIN podrá cambiar tu contraseña desde Usuarios."
    }


# =========================
# RECUPERAR CONTRASEÑA
# =========================

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        return {"message": "Si el correo existe, se generará una recuperación de contraseña"}

    token = secrets.token_urlsafe(32)

    user.reset_token = token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    db.commit()

    return {
        "message": "Token de recuperación generado",
        "reset_token": token,
    }


@router.post("/reset-password")
def reset_password_with_token(
    payload: ResetPasswordWithTokenRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.reset_token == payload.token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Token inválido")

    if not user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    expires_at = user.reset_token_expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        user.reset_token = None
        user.reset_token_expires_at = None
        db.commit()
        raise HTTPException(status_code=400, detail="Token expirado")

    user.hashed_password = hash_password(payload.new_password)
    user.must_change_password = False
    user.reset_token = None
    user.reset_token_expires_at = None

    db.commit()

    return {"message": "Contraseña actualizada correctamente"}