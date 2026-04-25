from sqlalchemy.orm import Session
from app.models.vehicle_event import VehicleEvent


def create_vehicle_event(
    db: Session,
    vehicle_id: int,
    event_type: str,
    description: str,
):
    event = VehicleEvent(
        vehicle_id=vehicle_id,
        event_type=event_type,
        description=description,
    )
    db.add(event)
    db.flush()
    return event