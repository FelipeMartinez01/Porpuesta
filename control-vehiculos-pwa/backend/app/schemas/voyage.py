from datetime import datetime
from pydantic import BaseModel, ConfigDict


class VoyageBase(BaseModel):
    vessel_id: int
    voyage_number: str
    origin: str | None = None
    destination: str | None = None
    arrival_date: datetime | None = None
    departure_date: datetime | None = None
    notes: str | None = None


class VoyageCreate(VoyageBase):
    pass


class VoyageUpdate(BaseModel):
    vessel_id: int | None = None
    voyage_number: str | None = None
    origin: str | None = None
    destination: str | None = None
    arrival_date: datetime | None = None
    departure_date: datetime | None = None
    notes: str | None = None


class VoyageResponse(BaseModel):
    id: int
    vessel_id: int
    voyage_number: str
    origin: str | None = None
    destination: str | None = None
    arrival_date: datetime | None = None
    departure_date: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    vessel_name: str | None = None

    model_config = ConfigDict(from_attributes=True)