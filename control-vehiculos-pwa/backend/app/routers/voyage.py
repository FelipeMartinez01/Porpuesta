from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.vessel import Vessel
from app.models.voyage import Voyage
from app.schemas.voyage import VoyageCreate, VoyageUpdate, VoyageResponse

router = APIRouter(prefix="/voyages", tags=["Voyages"])


def build_voyage_response(voyage: Voyage) -> VoyageResponse:
    return VoyageResponse(
        id=voyage.id,
        vessel_id=voyage.vessel_id,
        voyage_number=voyage.voyage_number,
        origin=voyage.origin,
        destination=voyage.destination,
        arrival_date=voyage.arrival_date,
        departure_date=voyage.departure_date,
        notes=voyage.notes,
        created_at=voyage.created_at,
        updated_at=voyage.updated_at,
        vessel_name=voyage.vessel.name if voyage.vessel else None,
    )


@router.post("/", response_model=VoyageResponse, status_code=status.HTTP_201_CREATED)
def create_voyage(payload: VoyageCreate, db: Session = Depends(get_db)):
    vessel = db.query(Vessel).filter(Vessel.id == payload.vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=400, detail="vessel_id no existe")

    voyage = Voyage(**payload.model_dump())
    db.add(voyage)
    db.commit()
    db.refresh(voyage)

    voyage = (
        db.query(Voyage)
        .options(joinedload(Voyage.vessel))
        .filter(Voyage.id == voyage.id)
        .first()
    )

    return build_voyage_response(voyage)


@router.get("/", response_model=list[VoyageResponse])
def list_voyages(
    vessel_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Voyage).options(joinedload(Voyage.vessel))

    if vessel_id is not None:
        query = query.filter(Voyage.vessel_id == vessel_id)

    voyages = query.order_by(Voyage.id.desc()).all()
    return [build_voyage_response(voyage) for voyage in voyages]


@router.get("/{voyage_id}", response_model=VoyageResponse)
def get_voyage(voyage_id: int, db: Session = Depends(get_db)):
    voyage = (
        db.query(Voyage)
        .options(joinedload(Voyage.vessel))
        .filter(Voyage.id == voyage_id)
        .first()
    )

    if not voyage:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    return build_voyage_response(voyage)


@router.put("/{voyage_id}", response_model=VoyageResponse)
def update_voyage(voyage_id: int, payload: VoyageUpdate, db: Session = Depends(get_db)):
    voyage = db.query(Voyage).filter(Voyage.id == voyage_id).first()
    if not voyage:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    data = payload.model_dump(exclude_unset=True)

    if "vessel_id" in data:
      vessel = db.query(Vessel).filter(Vessel.id == data["vessel_id"]).first()
      if not vessel:
          raise HTTPException(status_code=400, detail="vessel_id no existe")

    for key, value in data.items():
        setattr(voyage, key, value)

    db.commit()
    db.refresh(voyage)

    voyage = (
        db.query(Voyage)
        .options(joinedload(Voyage.vessel))
        .filter(Voyage.id == voyage.id)
        .first()
    )

    return build_voyage_response(voyage)


@router.delete("/{voyage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_voyage(voyage_id: int, db: Session = Depends(get_db)):
    voyage = db.query(Voyage).filter(Voyage.id == voyage_id).first()
    if not voyage:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    db.delete(voyage)
    db.commit()
    return None