from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.parking_slot import ParkingSlot
from app.schemas.parking_slot import ParkingSlotResponse

router = APIRouter(prefix="/parking-slots", tags=["Parking Slots"])


@router.get("/", response_model=list[ParkingSlotResponse])
def list_parking_slots(
    sector_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(ParkingSlot)

    if sector_id is not None:
        query = query.filter(ParkingSlot.sector_id == sector_id)

    slots = query.order_by(ParkingSlot.row_num.asc(), ParkingSlot.col_num.asc()).all()
    return slots