from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, case
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.shipment import Shipment
from app.models.voyage import Voyage
from app.models.vessel import Vessel
from app.models.vehicle import Vehicle
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate, ShipmentResponse
from app.schemas.shipment_dashboard import ShipmentDashboardResponse

router = APIRouter(prefix="/shipments", tags=["Shipments"])


def build_shipment_response(shipment: Shipment) -> ShipmentResponse:
    return ShipmentResponse(
        id=shipment.id,
        bl_number=shipment.bl_number,
        voyage_id=shipment.voyage_id,
        notes=shipment.notes,
        created_at=shipment.created_at,
        updated_at=shipment.updated_at,
        vessel_name=shipment.voyage.vessel.name if shipment.voyage and shipment.voyage.vessel else None,
        voyage_number=shipment.voyage.voyage_number if shipment.voyage else None,
    )


@router.post("/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Shipment).filter(Shipment.bl_number == payload.bl_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un BL con ese número")

    voyage = db.query(Voyage).filter(Voyage.id == payload.voyage_id).first()
    if not voyage:
        raise HTTPException(status_code=400, detail="voyage_id no existe")

    shipment = Shipment(**payload.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    shipment = (
        db.query(Shipment)
        .options(joinedload(Shipment.voyage).joinedload(Voyage.vessel))
        .filter(Shipment.id == shipment.id)
        .first()
    )

    return build_shipment_response(shipment)


@router.get("/", response_model=list[ShipmentResponse])
def list_shipments(
    voyage_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Shipment).options(
        joinedload(Shipment.voyage).joinedload(Voyage.vessel)
    )

    if voyage_id is not None:
        query = query.filter(Shipment.voyage_id == voyage_id)

    shipments = query.order_by(Shipment.id.desc()).all()
    return [build_shipment_response(shipment) for shipment in shipments]


@router.get("/dashboard/summary", response_model=list[ShipmentDashboardResponse])
def shipment_dashboard(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Shipment.id.label("shipment_id"),
            Shipment.bl_number.label("bl_number"),
            Vessel.name.label("vessel_name"),
            Voyage.voyage_number.label("voyage_number"),
            Voyage.origin.label("origin"),
            Voyage.arrival_date.label("arrival_date"),

            func.count(Vehicle.id).label("total_vehicles"),

            func.sum(case((Vehicle.status == "FALTANTE", 1), else_=0)).label("faltante"),
            func.sum(case((Vehicle.status == "DIRECTO", 1), else_=0)).label("directo"),
            func.sum(case((Vehicle.status == "ALMACENADO", 1), else_=0)).label("almacenado"),
            func.sum(case((Vehicle.status == "EN_TRANSITO", 1), else_=0)).label("en_transito"),
            func.sum(case((Vehicle.status == "DESPACHADO", 1), else_=0)).label("despachado"),
        )
        .outerjoin(Voyage, Shipment.voyage_id == Voyage.id)
        .outerjoin(Vessel, Voyage.vessel_id == Vessel.id)
        .outerjoin(Vehicle, Vehicle.shipment_id == Shipment.id)
        .group_by(
            Shipment.id,
            Shipment.bl_number,
            Vessel.name,
            Voyage.voyage_number,
            Voyage.origin,
            Voyage.arrival_date,
        )
        .order_by(Shipment.id.desc())
        .all()
    )

    return [
        ShipmentDashboardResponse(
            shipment_id=row.shipment_id,
            bl_number=row.bl_number,
            vessel_name=row.vessel_name,
            origin=row.origin,
            total_vehicles=row.total_vehicles or 0,
            faltante=row.faltante or 0,
            directo=row.directo or 0,
            almacenado=row.almacenado or 0,
            en_transito=row.en_transito or 0,
            despachado=row.despachado or 0,
        )
        for row in rows
    ]


@router.get("/{shipment_id}", response_model=ShipmentResponse)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    shipment = (
        db.query(Shipment)
        .options(joinedload(Shipment.voyage).joinedload(Voyage.vessel))
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if not shipment:
        raise HTTPException(status_code=404, detail="BL no encontrado")

    return build_shipment_response(shipment)


@router.put("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id: int,
    payload: ShipmentUpdate,
    db: Session = Depends(get_db),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="BL no encontrado")

    data = payload.model_dump(exclude_unset=True)

    if "bl_number" in data:
        existing = (
            db.query(Shipment)
            .filter(
                Shipment.bl_number == data["bl_number"],
                Shipment.id != shipment_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro BL con ese número")

    if "voyage_id" in data:
        voyage = db.query(Voyage).filter(Voyage.id == data["voyage_id"]).first()
        if not voyage:
            raise HTTPException(status_code=400, detail="voyage_id no existe")

    for key, value in data.items():
        setattr(shipment, key, value)

    db.commit()
    db.refresh(shipment)

    shipment = (
        db.query(Shipment)
        .options(joinedload(Shipment.voyage).joinedload(Voyage.vessel))
        .filter(Shipment.id == shipment.id)
        .first()
    )

    return build_shipment_response(shipment)


@router.delete("/{shipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipment(shipment_id: int, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="BL no encontrado")

    db.delete(shipment)
    db.commit()
    return None