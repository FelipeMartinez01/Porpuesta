from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.carrier import Carrier
from app.models.sector import Sector
from app.models.shipment import Shipment
from app.services.import_service import import_vehicles

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/vehicles")
def upload_vehicles(
    file: UploadFile = File(...),
    carrier_id: int = Query(...),
    sector_id: int = Query(...),
    shipment_id: int = Query(...),
    db: Session = Depends(get_db),
):
    carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=400, detail="carrier_id no existe")

    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=400, detail="sector_id no existe")

    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=400, detail="shipment_id no existe")

    try:
        result = import_vehicles(
            file=file,
            db=db,
            carrier_id=carrier_id,
            sector_id=sector_id,
            shipment_id=shipment_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))