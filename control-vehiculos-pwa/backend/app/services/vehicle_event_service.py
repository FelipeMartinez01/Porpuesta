from sqlalchemy.orm import Session
from app.models.vehicle_event import VehicleEvent
from app.models.user import User


def create_vehicle_event(
    db: Session,
    vehicle_id: int,
    event_type: str,
    description: str,
    current_user: User | None = None,
):
    event = VehicleEvent(
        vehicle_id=vehicle_id,
        event_type=event_type,
        description=description,
        user_id=current_user.id if current_user else None,
        username=current_user.username if current_user else None,
    )

    db.add(event)
    db.flush()

    return event