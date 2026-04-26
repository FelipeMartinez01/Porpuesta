from datetime import datetime, date
from pydantic import BaseModel, ConfigDict


# 🔹 BASE
class VoyageBase(BaseModel):
    vessel_id: int
    voyage_number: str
    origin: str | None = None
    destination: str | None = None
    arrival_date: date | None = None
    departure_date: date | None = None
    notes: str | None = None


# 🔹 CREATE
class VoyageCreate(VoyageBase):
    pass


# 🔹 UPDATE
class VoyageUpdate(BaseModel):
    vessel_id: int | None = None
    voyage_number: str | None = None
    origin: str | None = None
    destination: str | None = None
    arrival_date: date | None = None
    departure_date: date | None = None
    notes: str | None = None


# 🔹 RESPONSE
class VoyageResponse(BaseModel):
    id: int
    vessel_id: int
    voyage_number: str
    origin: str | None = None
    destination: str | None = None
    arrival_date: date | None = None
    departure_date: date | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    # 🔥 extras para frontend
    vessel_name: str | None = None

    model_config = ConfigDict(from_attributes=True)