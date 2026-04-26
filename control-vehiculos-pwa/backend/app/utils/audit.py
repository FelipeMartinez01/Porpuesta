from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User


def create_audit_log(
    db: Session,
    action: str,
    description: str,
    current_user: User | None = None,
    entity: str | None = None,
    entity_id: str | int | None = None,
    extra_data: dict | None = None,
):
    try:
        audit = AuditLog(
            user_id=current_user.id if current_user else None,
            username=current_user.username if current_user else None,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            description=description,
            extra_data=extra_data or {},
        )

        db.add(audit)
        db.flush()

    except Exception as error:
        print("ERROR CREANDO AUDITORÍA:", error)
        db.rollback()