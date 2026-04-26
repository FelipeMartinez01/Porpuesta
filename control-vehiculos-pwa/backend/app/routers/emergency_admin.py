from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User


router = APIRouter(prefix="/emergency-admin", tags=["Emergency Admin"])


EMERGENCY_KEY = "admin-emergencia-2026"


class EmergencyAdminReset(BaseModel):
    emergency_key: str
    username: str = "admin"
    new_password: str


@router.post("/reset")
def emergency_admin_reset(
    payload: EmergencyAdminReset,
    db: Session = Depends(get_db),
):
    if payload.emergency_key != EMERGENCY_KEY:
        raise HTTPException(status_code=403, detail="Clave de emergencia incorrecta")

    if len(payload.new_password.strip()) < 6:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 6 caracteres",
        )

    user = db.query(User).filter(User.username == payload.username).first()

    if not user:
        user = User(
            username=payload.username,
            hashed_password=hash_password(payload.new_password.strip()),
            role="ADMIN",
            permissions=[],
            is_active=True,
            must_change_password=False,
        )
        db.add(user)
    else:
        user.hashed_password = hash_password(payload.new_password.strip())
        user.role = "ADMIN"
        user.is_active = True
        user.must_change_password = False
        user.reset_token = None
        user.reset_token_expires_at = None

    db.commit()

    return {
        "message": "ADMIN recuperado correctamente",
        "username": payload.username,
    }