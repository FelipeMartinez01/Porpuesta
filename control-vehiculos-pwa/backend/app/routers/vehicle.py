from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.carrier import Carrier
from app.models.sector import Sector
from app.models.parking_slot import ParkingSlot
from app.models.vehicle_event import VehicleEvent
from app.models.shipment import Shipment
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleStatusUpdate,
    VehicleAssignSlot,
)
from app.schemas.vehicle_event import VehicleEventResponse
from app.services.vehicle_event_service import create_vehicle_event
from app.utils.audit import create_audit_log

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


ALLOWED_TRANSITIONS = {
    "FALTANTE": {"DIRECTO", "ALMACENADO"},
    "DIRECTO": {"DESPACHADO"},
    "ALMACENADO": {"EN_TRANSITO"},
    "EN_TRANSITO": {"DESPACHADO"},
    "DESPACHADO": set(),
}


def validate_relations(
    db: Session,
    carrier_id: int | None,
    sector_id: int | None,
    slot_id: int | None,
    shipment_id: int | None = None,
):
    if carrier_id is not None:
        carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
        if not carrier:
            raise HTTPException(status_code=400, detail="carrier_id no existe")

    if sector_id is not None:
        sector = db.query(Sector).filter(Sector.id == sector_id).first()
        if not sector:
            raise HTTPException(status_code=400, detail="sector_id no existe")

    if slot_id is not None:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=400, detail="slot_id no existe")

    if shipment_id is not None:
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            raise HTTPException(status_code=400, detail="shipment_id no existe")


def build_vehicle_response(vehicle: Vehicle) -> VehicleResponse:
    return VehicleResponse(
        id=vehicle.id,
        vin=vehicle.vin,
        barcode_id=vehicle.barcode_id,
        shipment_id=vehicle.shipment_id,
        shipment_bl=vehicle.shipment.bl_number if vehicle.shipment else None,
        color=vehicle.color,
        brand=vehicle.brand,
        model=vehicle.model,
        vehicle_year=vehicle.vehicle_year,
        carrier_id=vehicle.carrier_id,
        sector_id=vehicle.sector_id,
        slot_id=vehicle.slot_id,
        status=vehicle.status,
        photo_url=vehicle.photo_url,
        notes=vehicle.notes,
        created_at=vehicle.created_at,
        updated_at=vehicle.updated_at,
        carrier_name=vehicle.carrier.name if vehicle.carrier else None,
        sector_name=vehicle.sector.name if vehicle.sector else None,
    )


def reload_vehicle(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = (
        db.query(Vehicle)
        .options(
            joinedload(Vehicle.carrier),
            joinedload(Vehicle.sector),
            joinedload(Vehicle.shipment),
        )
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    return vehicle


def release_vehicle_slot_if_needed(db: Session, vehicle: Vehicle, current_user: User):
    if vehicle.slot_id is None:
        return

    old_slot = db.query(ParkingSlot).filter(ParkingSlot.id == vehicle.slot_id).first()

    if old_slot:
        old_slot.visual_status = "DISPONIBLE"

        create_vehicle_event(
            db=db,
            vehicle_id=vehicle.id,
            event_type="SLOT_RELEASED",
            description=f"Slot {old_slot.code} liberado",
            current_user=current_user,
        )

    vehicle.slot_id = None


# =========================
# CREATE
# =========================
@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Vehicle).filter(Vehicle.vin == payload.vin).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con ese VIN")

    validate_relations(
        db,
        payload.carrier_id,
        payload.sector_id,
        payload.slot_id,
        payload.shipment_id,
    )

    vehicle_data = payload.model_dump()
    vehicle_data["barcode_id"] = vehicle_data["vin"]

    vehicle = Vehicle(**vehicle_data)
    db.add(vehicle)
    db.flush()

    create_vehicle_event(
        db=db,
        vehicle_id=vehicle.id,
        event_type="CREATED",
        description=f"Vehículo creado con VIN {vehicle.vin}",
        current_user=current_user,
    )

    create_audit_log(
        db=db,
        current_user=current_user,
        action="CREATE_VEHICLE",
        entity="vehicles",
        entity_id=vehicle.id,
        description=f"Creó vehículo VIN {vehicle.vin}",
        extra_data={"vin": vehicle.vin},
    )

    db.commit()

    vehicle = reload_vehicle(db, vehicle.id)
    return build_vehicle_response(vehicle)


# =========================
# STATUS
# =========================
@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def update_vehicle_status(
    vehicle_id: int,
    payload: VehicleStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    current_status = vehicle.status
    new_status = payload.status

    if new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Transición inválida: {current_status} → {new_status}",
        )

    if new_status in ["EN_TRANSITO", "DESPACHADO"]:
        release_vehicle_slot_if_needed(db, vehicle, current_user)

    vehicle.status = new_status

    create_vehicle_event(
        db=db,
        vehicle_id=vehicle.id,
        event_type="STATUS_CHANGED",
        description=f"{current_status} → {new_status}",
        current_user=current_user,
    )

    create_audit_log(
        db=db,
        current_user=current_user,
        action="UPDATE_STATUS",
        entity="vehicles",
        entity_id=vehicle.id,
        description=f"{vehicle.vin}: {current_status} → {new_status}",
        extra_data={
            "vin": vehicle.vin,
            "from": current_status,
            "to": new_status,
        },
    )

    db.commit()

    vehicle = reload_vehicle(db, vehicle.id)
    return build_vehicle_response(vehicle)


# =========================
# EVENTS
# =========================
@router.get("/{vehicle_id}/events", response_model=list[VehicleEventResponse])
def list_vehicle_events(vehicle_id: int, db: Session = Depends(get_db)):
    return (
        db.query(VehicleEvent)
        .filter(VehicleEvent.vehicle_id == vehicle_id)
        .order_by(VehicleEvent.created_at.desc())
        .all()
    )