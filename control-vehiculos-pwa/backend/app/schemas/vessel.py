from datetime import datetime
from pydantic import BaseModel, ConfigDict


# 🔹 BASE
class VesselBase(BaseModel):
    name: str
    imo: str | None = None
    notes: str | None = None


# 🔹 CREATE
class VesselCreate(VesselBase):
    pass


# 🔹 UPDATE
class VesselUpdate(BaseModel):
    name: str | None = None
    imo: str | None = None
    notes: str | None = None


# 🔹 RESPONSE
class VesselResponse(BaseModel):
    id: int
    name: str
    imo: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)