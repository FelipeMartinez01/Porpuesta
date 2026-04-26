from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.vessel import Vessel
from app.schemas.vessel import VesselCreate, VesselUpdate, VesselResponse

router = APIRouter(prefix="/vessels", tags=["Vessels"])


@router.post("/", response_model=VesselResponse, status_code=status.HTTP_201_CREATED)
def create_vessel(payload: VesselCreate, db: Session = Depends(get_db)):
    existing = db.query(Vessel).filter(Vessel.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una nave con ese nombre")

    vessel = Vessel(**payload.model_dump())
    db.add(vessel)
    db.commit()
    db.refresh(vessel)
    return vessel


@router.get("/", response_model=list[VesselResponse])
def list_vessels(db: Session = Depends(get_db)):
    return db.query(Vessel).order_by(Vessel.name.asc()).all()


@router.get("/{vessel_id}", response_model=VesselResponse)
def get_vessel(vessel_id: int, db: Session = Depends(get_db)):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Nave no encontrada")
    return vessel


@router.put("/{vessel_id}", response_model=VesselResponse)
def update_vessel(vessel_id: int, payload: VesselUpdate, db: Session = Depends(get_db)):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Nave no encontrada")

    data = payload.model_dump(exclude_unset=True)

    if "name" in data:
        existing = db.query(Vessel).filter(
            Vessel.name == data["name"],
            Vessel.id != vessel_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otra nave con ese nombre")

    for key, value in data.items():
        setattr(vessel, key, value)

    db.commit()
    db.refresh(vessel)
    return vessel


@router.delete("/{vessel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vessel(vessel_id: int, db: Session = Depends(get_db)):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Nave no encontrada")

    db.delete(vessel)
    db.commit()
    return None