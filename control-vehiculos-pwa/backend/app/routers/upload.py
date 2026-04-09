from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.import_service import import_vehicles

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/vehicles")
def upload_vehicles(
    file: UploadFile = File(...),
    carrier_id: int = 1,
    sector_id: int = 1,
    db: Session = Depends(get_db)
):
    try:
        result = import_vehicles(file, db, carrier_id, sector_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))