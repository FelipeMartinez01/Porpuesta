from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.carrier import Carrier
from app.schemas.carrier import CarrierCreate, CarrierUpdate, CarrierResponse

router = APIRouter(prefix="/carriers", tags=["Carriers"])


@router.post("/", response_model=CarrierResponse, status_code=status.HTTP_201_CREATED)
def create_carrier(payload: CarrierCreate, db: Session = Depends(get_db)):
    existing = db.query(Carrier).filter(Carrier.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un porteador con ese nombre")

    carrier = Carrier(**payload.model_dump())
    db.add(carrier)
    db.commit()
    db.refresh(carrier)
    return carrier


@router.get("/", response_model=list[CarrierResponse])
def list_carriers(db: Session = Depends(get_db)):
    carriers = db.query(Carrier).order_by(Carrier.id.asc()).all()
    return carriers


@router.get("/{carrier_id}", response_model=CarrierResponse)
def get_carrier(carrier_id: int, db: Session = Depends(get_db)):
    carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Porteador no encontrado")
    return carrier


@router.put("/{carrier_id}", response_model=CarrierResponse)
def update_carrier(carrier_id: int, payload: CarrierUpdate, db: Session = Depends(get_db)):
    carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Porteador no encontrado")

    update_data = payload.model_dump(exclude_unset=True)

    if "name" in update_data:
        existing = db.query(Carrier).filter(Carrier.name == update_data["name"], Carrier.id != carrier_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro porteador con ese nombre")

    for key, value in update_data.items():
        setattr(carrier, key, value)

    db.commit()
    db.refresh(carrier)
    return carrier


@router.delete("/{carrier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_carrier(carrier_id: int, db: Session = Depends(get_db)):
    carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Porteador no encontrado")

    db.delete(carrier)
    db.commit()
    return None