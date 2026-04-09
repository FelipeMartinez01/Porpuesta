from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.carrier import Carrier
from app.models.sector import Sector
from app.models.parking_slot import ParkingSlot
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleStatusUpdate,
    VehicleAssignSlot,
)

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


def validate_relations(db: Session, carrier_id: int | None, sector_id: int | None, slot_id: int | None):
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


def build_vehicle_response(vehicle: Vehicle) -> VehicleResponse:
    return VehicleResponse(
        id=vehicle.id,
        vin=vehicle.vin,
        barcode_id=vehicle.barcode_id,
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


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(Vehicle).filter(Vehicle.vin == payload.vin).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con ese VIN")

    validate_relations(db, payload.carrier_id, payload.sector_id, payload.slot_id)

    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    vehicle = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.carrier), joinedload(Vehicle.sector))
        .filter(Vehicle.id == vehicle.id)
        .first()
    )

    return build_vehicle_response(vehicle)


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(
    vin: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    carrier_id: int | None = Query(default=None),
    sector_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.carrier), joinedload(Vehicle.sector))
    )

    if vin:
        query = query.filter(Vehicle.vin.ilike(f"%{vin}%"))

    if status_filter:
        query = query.filter(Vehicle.status == status_filter)

    if carrier_id is not None:
        query = query.filter(Vehicle.carrier_id == carrier_id)

    if sector_id is not None:
        query = query.filter(Vehicle.sector_id == sector_id)

    vehicles = query.order_by(Vehicle.id.asc()).all()

    return [build_vehicle_response(vehicle) for vehicle in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.carrier), joinedload(Vehicle.sector))
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    return build_vehicle_response(vehicle)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    update_data = payload.model_dump(exclude_unset=True)

    if "vin" in update_data:
        existing = db.query(Vehicle).filter(Vehicle.vin == update_data["vin"], Vehicle.id != vehicle_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro vehículo con ese VIN")

    validate_relations(
        db,
        update_data.get("carrier_id", vehicle.carrier_id),
        update_data.get("sector_id", vehicle.sector_id),
        update_data.get("slot_id", vehicle.slot_id),
    )

    for key, value in update_data.items():
        setattr(vehicle, key, value)

    db.commit()
    db.refresh(vehicle)

    vehicle = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.carrier), joinedload(Vehicle.sector))
        .filter(Vehicle.id == vehicle.id)
        .first()
    )

    return build_vehicle_response(vehicle)


@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
def update_vehicle_status(vehicle_id: int, payload: VehicleStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = {"FALTANTE", "EN_TRANSITO", "RECEPCIONADO"}

    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Estado no válido")

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    vehicle.status = payload.status

    db.commit()
    db.refresh(vehicle)

    vehicle = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.carrier), joinedload(Vehicle.sector))
        .filter(Vehicle.id == vehicle.id)
        .first()
    )

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

    vehicle.slot_id = payload.slot_id
    vehicle.status = "RECEPCIONADO"
    slot.visual_status = "OCUPADO"

    db.commit()
    db.refresh(vehicle)

    vehicle = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.carrier), joinedload(Vehicle.sector))
        .filter(Vehicle.id == vehicle.id)
        .first()
    )

    return build_vehicle_response(vehicle)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    db.delete(vehicle)
    db.commit()
    return None