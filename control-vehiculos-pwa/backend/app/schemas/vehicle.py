from datetime import datetime
from pydantic import BaseModel, ConfigDict


class VehicleBase(BaseModel):
    vin: str
    shipment_id: int | None = None

    color: str | None = None
    brand: str | None = None
    model: str | None = None
    vehicle_year: int | None = None

    carrier_id: int | None = None
    sector_id: int | None = None
    slot_id: int | None = None

    status: str = "FALTANTE"
    photo_url: str | None = None
    notes: str | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vin: str | None = None
    shipment_id: int | None = None

    color: str | None = None
    brand: str | None = None
    model: str | None = None
    vehicle_year: int | None = None

    carrier_id: int | None = None
    sector_id: int | None = None
    slot_id: int | None = None

    status: str | None = None
    photo_url: str | None = None
    notes: str | None = None


class VehicleStatusUpdate(BaseModel):
    status: str


class VehicleAssignSlot(BaseModel):
    slot_id: int


class VehicleResponse(BaseModel):
    id: int
    vin: str

    shipment_id: int | None = None
    shipment_bl: str | None = None
    vessel_name: str | None = None
    voyage_number: str | None = None

    barcode_id: str | None = None

    color: str | None = None
    brand: str | None = None
    model: str | None = None
    vehicle_year: int | None = None

    carrier_id: int | None = None
    sector_id: int | None = None
    slot_id: int | None = None

    # 🔥 NUEVO
    slot_code: str | None = None
    location_label: str | None = None

    status: str
    photo_url: str | None = None
    notes: str | None = None

    created_at: datetime
    updated_at: datetime

    carrier_name: str | None = None
    sector_name: str | None = None

    model_config = ConfigDict(from_attributes=True)