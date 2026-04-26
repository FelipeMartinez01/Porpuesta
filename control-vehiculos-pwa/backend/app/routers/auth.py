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
from app.utils.audit import create_audit_log

router = APIRouter(prefix="/auth", tags=["Auth"])


# =========================
# REGISTER
# =========================
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
    db.flush()

    create_audit_log(
        db=db,
        current_user=current_user,
        action="CREATE_USER",
        entity="users",
        entity_id=user.id,
        description=f"Creó el usuario {user.username}",
        extra_data={"role": user.role},
    )

    db.commit()
    db.refresh(user)

    return user


# =========================
# LOGIN (FIXED)
# =========================
@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    # 🔥 AUDITORÍA SEGURA (NO ROMPE LOGIN)
    try:
        create_audit_log(
            db=db,
            current_user=user,
            action="LOGIN",
            entity="auth",
            entity_id=user.id,
            description=f"Login de {user.username}",
            extra_data={"role": user.role},
        )
        db.commit()
    except Exception as e:
        print("ERROR AUDITORIA LOGIN:", e)
        db.rollback()

    token = create_access_token(data={"sub": user.username, "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


# =========================
# ME
# =========================
@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# =========================
# LIST USERS
# =========================
@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    return db.query(User).order_by(User.id.asc()).all()


# =========================
# PERMISSIONS
# =========================
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

    user.permissions = payload.permissions

    create_audit_log(
        db=db,
        current_user=current_user,
        action="UPDATE_PERMISSIONS",
        entity="users",
        entity_id=user.id,
        description=f"Actualizó permisos de {user.username}",
        extra_data={"permissions": payload.permissions},
    )

    db.commit()
    db.refresh(user)

    return user


# =========================
# ADMIN RESET PASSWORD
# =========================
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

    user.hashed_password = hash_password(payload.new_password)
    user.must_change_password = False

    create_audit_log(
        db=db,
        current_user=current_user,
        action="ADMIN_RESET_PASSWORD",
        entity="users",
        entity_id=user.id,
        description=f"Reset password de {user.username}",
        extra_data=None,
    )

    db.commit()
    db.refresh(user)

    return user


# =========================
# REQUIRE PASSWORD CHANGE
# =========================
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


# =========================
# REQUEST FROM LOGIN
# =========================
@router.post("/request-password-change")
def request_password_change_from_login(
    payload: PasswordChangeRequestFromLogin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == payload.username).first()

    if not user:
        return {"message": "Si el usuario existe, se notificará"}

    user.must_change_password = True
    db.commit()

    return {"message": "Solicitud enviada"}


# =========================
# FORGOT PASSWORD
# =========================
@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        return {"message": "Si el correo existe..."}

    token = secrets.token_urlsafe(32)

    user.reset_token = token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    db.commit()

    return {"reset_token": token}


# =========================
# RESET PASSWORD TOKEN
# =========================
@router.post("/reset-password")
def reset_password_with_token(
    payload: ResetPasswordWithTokenRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.reset_token == payload.token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Token inválido")

    user.hashed_password = hash_password(payload.new_password)
    user.must_change_password = False
    user.reset_token = None
    user.reset_token_expires_at = None

    db.commit()

    return {"message": "Contraseña actualizada"}