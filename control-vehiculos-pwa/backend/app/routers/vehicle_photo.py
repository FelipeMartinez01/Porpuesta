from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.vehicle_photo import VehiclePhoto
from app.services.file_service import save_vehicle_photo
from app.services.vehicle_event_service import create_vehicle_event


router = APIRouter(prefix="/vehicle-photos", tags=["Vehicle Photos"])


@router.post("/{vehicle_id}", status_code=status.HTTP_201_CREATED)
def upload_vehicle_photo(
    vehicle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    try:
        saved_path = save_vehicle_photo(file, vehicle_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    photo = VehiclePhoto(
        vehicle_id=vehicle_id,
        file_path=saved_path,
    )
    db.add(photo)

    vehicle.photo_url = saved_path

    create_vehicle_event(
        db=db,
        vehicle_id=vehicle_id,
        event_type="PHOTO_UPLOADED",
        description="Se subió una foto del vehículo",
    )

    db.commit()
    db.refresh(photo)
    db.refresh(vehicle)

    return {
        "message": "Foto subida correctamente",
        "vehicle_id": vehicle_id,
        "photo_id": photo.id,
        "file_path": saved_path,
    }