from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.parking_slot import ParkingSlot

router = APIRouter(prefix="/dashboard-general", tags=["Dashboard General"])


def hours_between(start: datetime | None, end: datetime) -> int:
    if not start:
        return 0

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)

    return int((end - start).total_seconds() // 3600)


@router.get("/summary")
def dashboard_general_summary(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    vehicles = db.query(Vehicle).all()
    slots = db.query(ParkingSlot).all()

    total_vehicles = len(vehicles)

    faltante = len([v for v in vehicles if v.status == "FALTANTE"])
    directo = len([v for v in vehicles if v.status == "DIRECTO"])
    almacenado = len([v for v in vehicles if v.status == "ALMACENADO"])
    en_transito = len([v for v in vehicles if v.status == "EN_TRANSITO"])
    despachado = len([v for v in vehicles if v.status == "DESPACHADO"])

    recibidos = directo + almacenado + en_transito + despachado

    reception_percent = (
        round((recibidos / total_vehicles) * 100)
        if total_vehicles > 0
        else 0
    )

    dispatch_percent = (
        round((despachado / total_vehicles) * 100)
        if total_vehicles > 0
        else 0
    )

    vehicles_in_yard = almacenado

    stored_vehicles = [v for v in vehicles if v.status == "ALMACENADO"]

    if stored_vehicles:
        average_yard_hours = round(
            sum(hours_between(v.updated_at, now) for v in stored_vehicles)
            / len(stored_vehicles),
            1,
        )
    else:
        average_yard_hours = 0

    total_slots = len(slots)
    occupied_slots = len([s for s in slots if s.visual_status == "OCUPADO"])
    available_slots = len([s for s in slots if s.visual_status == "DISPONIBLE"])

    yard_occupancy_percent = (
        round((occupied_slots / total_slots) * 100)
        if total_slots > 0
        else 0
    )

    return {
        "total_vehicles": total_vehicles,
        "reception_percent": reception_percent,
        "dispatch_percent": dispatch_percent,
        "vehicles_in_yard": vehicles_in_yard,
        "average_yard_hours": average_yard_hours,
        "yard_occupancy_percent": yard_occupancy_percent,
        "total_slots": total_slots,
        "occupied_slots": occupied_slots,
        "available_slots": available_slots,
        "status_counts": {
            "faltante": faltante,
            "directo": directo,
            "almacenado": almacenado,
            "en_transito": en_transito,
            "despachado": despachado,
        },
    }
