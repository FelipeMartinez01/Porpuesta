from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sector import Sector
from app.schemas.sector import SectorCreate, SectorUpdate, SectorResponse

router = APIRouter(prefix="/sectors", tags=["Sectors"])


@router.post("/", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_sector(payload: SectorCreate, db: Session = Depends(get_db)):
    existing = db.query(Sector).filter(Sector.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un sector con ese nombre")

    sector = Sector(**payload.model_dump())
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector


@router.get("/", response_model=list[SectorResponse])
def list_sectors(db: Session = Depends(get_db)):
    sectors = db.query(Sector).order_by(Sector.id.asc()).all()
    return sectors


@router.get("/{sector_id}", response_model=SectorResponse)
def get_sector(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector no encontrado")
    return sector


@router.put("/{sector_id}", response_model=SectorResponse)
def update_sector(sector_id: int, payload: SectorUpdate, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector no encontrado")

    update_data = payload.model_dump(exclude_unset=True)

    if "name" in update_data:
        existing = db.query(Sector).filter(Sector.name == update_data["name"], Sector.id != sector_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe otro sector con ese nombre")

    for key, value in update_data.items():
        setattr(sector, key, value)

    db.commit()
    db.refresh(sector)
    return sector


@router.delete("/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector no encontrado")

    db.delete(sector)
    db.commit()
    return None