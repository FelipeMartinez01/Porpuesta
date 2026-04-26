from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.parking_slot import ParkingSlot

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def hours_between(start: datetime | None, end: datetime) -> int:
    if not start:
        return 0

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)

    return int((end - start).total_seconds() // 3600)


def vehicle_to_alert(vehicle: Vehicle, now: datetime):
    return {
        "vehicle_id": vehicle.id,
        "vin": vehicle.vin,
        "status": vehicle.status,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "carrier_name": vehicle.carrier.name if vehicle.carrier else None,
        "sector_name": vehicle.sector.name if vehicle.sector else None,
        "shipment_bl": vehicle.shipment.bl_number if vehicle.shipment else None,
        "slot_id": vehicle.slot_id,
        "hours_in_current_state": hours_between(vehicle.updated_at, now),
    }


@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    vehicles = (
        db.query(Vehicle)
        .options(
            joinedload(Vehicle.carrier),
            joinedload(Vehicle.sector),
            joinedload(Vehicle.shipment),
        )
        .all()
    )

    stuck_transit = []
    long_storage = []
    direct_pending = []
    slot_occupied_without_vehicle = []

    for vehicle in vehicles:
        hours = hours_between(vehicle.updated_at, now)

        if vehicle.status == "EN_TRANSITO" and hours >= 2:
            stuck_transit.append(vehicle_to_alert(vehicle, now))

        if vehicle.status == "ALMACENADO" and hours >= 72:
            long_storage.append(vehicle_to_alert(vehicle, now))

        if vehicle.status == "DIRECTO" and hours >= 4:
            direct_pending.append(vehicle_to_alert(vehicle, now))

    occupied_slots = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.visual_status == "OCUPADO")
        .all()
    )

    for slot in occupied_slots:
        vehicle = db.query(Vehicle).filter(Vehicle.slot_id == slot.id).first()

        if not vehicle:
            slot_occupied_without_vehicle.append(
                {
                    "slot_id": slot.id,
                    "slot_code": slot.code,
                    "sector_id": slot.sector_id,
                    "visual_status": slot.visual_status,
                }
            )

    total_alerts = (
        len(stuck_transit)
        + len(long_storage)
        + len(direct_pending)
        + len(slot_occupied_without_vehicle)
    )

    return {
        "total_alerts": total_alerts,
        "stuck_transit": stuck_transit,
        "long_storage": long_storage,
        "direct_pending": direct_pending,
        "slot_occupied_without_vehicle": slot_occupied_without_vehicle,
    }