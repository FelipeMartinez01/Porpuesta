from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
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


def release_vehicle_slot_if_needed(db: Session, vehicle: Vehicle):
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
        )

    vehicle.slot_id = None


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
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
    )

    if vehicle.shipment_id:
        create_vehicle_event(
            db=db,
            vehicle_id=vehicle.id,
            event_type="SHIPMENT_ASSIGNED",
            description=f"Vehículo asociado al BL ID {vehicle.shipment_id}",
        )

    db.commit()

    vehicle = reload_vehicle(db, vehicle.id)
    return build_vehicle_response(vehicle)


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(
    vin: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    carrier_id: int | None = Query(default=None),
    sector_id: int | None = Query(default=None),
    shipment_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle).options(
        joinedload(Vehicle.carrier),
        joinedload(Vehicle.sector),
        joinedload(Vehicle.shipment),
    )

    if vin:
        query = query.filter(Vehicle.vin.ilike(f"%{vin}%"))

    if status_filter:
        query = query.filter(Vehicle.status == status_filter)

    if carrier_id is not None:
        query = query.filter(Vehicle.carrier_id == carrier_id)

    if sector_id is not None:
        query = query.filter(Vehicle.sector_id == sector_id)

    if shipment_id is not None:
        query = query.filter(Vehicle.shipment_id == shipment_id)

    vehicles = query.order_by(Vehicle.id.asc()).all()
    return [build_vehicle_response(vehicle) for vehicle in vehicles]


@router.get("/by-slot/{slot_id}", response_model=VehicleResponse)
def get_vehicle_by_slot(slot_id: int, db: Session = Depends(get_db)):
    vehicle = (
        db.query(Vehicle)
        .options(
            joinedload(Vehicle.carrier),
            joinedload(Vehicle.sector),
            joinedload(Vehicle.shipment),
        )
        .filter(Vehicle.slot_id == slot_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(status_code=404, detail="No hay vehículo en este slot")

    return build_vehicle_response(vehicle)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = reload_vehicle(db, vehicle_id)
    return build_vehicle_response(vehicle)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    old_shipment_id = vehicle.shipment_id
    update_data = payload.model_dump(exclude_unset=True)

    if "vin" in update_data:
        existing = (
            db.query(Vehicle)
            .filter(Vehicle.vin == update_data["vin"], Vehicle.id != vehicle_id)
            .first()
        )

        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro vehículo con ese VIN")

        update_data["barcode_id"] = update_data["vin"]

    validate_relations(
        db,
        update_data.get("carrier_id", vehicle.carrier_id),
        update_data.get("sector_id", vehicle.sector_id),
        update_data.get("slot_id", vehicle.slot_id),
        update_data.get("shipment_id", vehicle.shipment_id),
    )

    for key, value in update_data.items():
        setattr(vehicle, key, value)

    create_vehicle_event(
        db=db,
        vehicle_id=vehicle.id,
        event_type="UPDATED",
        description="Datos del vehículo actualizados",
    )

    if "shipment_id" in update_data and old_shipment_id != vehicle.shipment_id:
        create_vehicle_event(
            db=db,
            vehicle_id=vehicle.id,
            event_type="SHIPMENT_CHANGED",
            description=f"BL cambiado de {old_shipment_id or '-'} a {vehicle.shipment_id or '-'}",
        )

    db.commit()

    vehicle = reload_vehicle(db, vehicle.id)
    return build_vehicle_response(vehicle)


@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def update_vehicle_status(
    vehicle_id: int,
    payload: VehicleStatusUpdate,
    db: Session = Depends(get_db),
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

    if new_status == "EN_TRANSITO":
        release_vehicle_slot_if_needed(db, vehicle)

    if new_status == "DESPACHADO":
        release_vehicle_slot_if_needed(db, vehicle)

    vehicle.status = new_status

    event_type = "STATUS_CHANGED"
    description = f"{current_status} → {new_status}"

    if new_status == "DIRECTO":
        event_type = "DIRECT_FLOW"
        description = "Vehículo marcado como DIRECTO"

    if new_status == "ALMACENADO":
        event_type = "STORED_FLOW"
        description = "Vehículo marcado como ALMACENADO"

    if new_status == "EN_TRANSITO":
        event_type = "IN_TRANSIT"
        description = "Vehículo marcado EN_TRANSITO"

    if new_status == "DESPACHADO":
        event_type = "DISPATCHED"
        description = "Vehículo despachado"

    create_vehicle_event(
        db=db,
        vehicle_id=vehicle.id,
        event_type=event_type,
        description=description,
    )

    db.commit()

    vehicle = reload_vehicle(db, vehicle.id)
    return build_vehicle_response(vehicle)


@router.patch("/{vehicle_id}/assign-slot", response_model=VehicleResponse)
def assign_slot(vehicle_id: int, payload: VehicleAssignSlot, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    slot = db.query(ParkingSlot).filter(ParkingSlot.id == payload.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot no encontrado")

    occupied = (
        db.query(Vehicle)
        .filter(Vehicle.slot_id == payload.slot_id, Vehicle.id != vehicle_id)
        .first()
    )
    if occupied:
        raise HTTPException(status_code=400, detail="Ese slot ya está ocupado por otro vehículo")

    if slot.visual_status == "OCUPADO":
        raise HTTPException(status_code=400, detail="Ese slot está marcado como ocupado")

    if vehicle.slot_id:
        old_slot = db.query(ParkingSlot).filter(ParkingSlot.id == vehicle.slot_id).first()
        if old_slot:
            old_slot.visual_status = "DISPONIBLE"

            create_vehicle_event(
                db=db,
                vehicle_id=vehicle.id,
                event_type="SLOT_RELEASED",
                description=f"Slot anterior {old_slot.code} liberado",
            )

    vehicle.slot_id = payload.slot_id
    vehicle.status = "ALMACENADO"
    slot.visual_status = "OCUPADO"

    create_vehicle_event(
        db=db,
        vehicle_id=vehicle.id,
        event_type="SLOT_ASSIGNED",
        description=f"Vehículo asignado al slot {slot.code}",
    )

    db.commit()

    vehicle = reload_vehicle(db, vehicle.id)
    return build_vehicle_response(vehicle)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    release_vehicle_slot_if_needed(db, vehicle)

    db.delete(vehicle)
    db.commit()

    return None


@router.get("/{vehicle_id}/events", response_model=list[VehicleEventResponse])
def list_vehicle_events(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    events = (
        db.query(VehicleEvent)
        .filter(VehicleEvent.vehicle_id == vehicle_id)
        .order_by(VehicleEvent.created_at.desc())
        .all()
    )

    return events