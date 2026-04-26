from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.parking_slot import ParkingSlot
from app.models.vehicle import Vehicle

router = APIRouter(prefix="/parking-slots", tags=["Parking Slots"])


@router.get("/")
def list_parking_slots(
    sector_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(ParkingSlot)

    if sector_id is not None:
        query = query.filter(ParkingSlot.sector_id == sector_id)

    return query.order_by(ParkingSlot.id.asc()).all()


@router.post("/reset")
def reset_parking(db: Session = Depends(get_db)):
    db.query(ParkingSlot).update({
        ParkingSlot.visual_status: "DISPONIBLE"
    })

    db.query(Vehicle).update({
        Vehicle.slot_id: None
    })

    db.commit()

    return {"message": "Mapa reiniciado correctamente"}