from datetime import datetime
from pydantic import BaseModel, ConfigDict


# 🔹 BASE
class ShipmentBase(BaseModel):
    bl_number: str
    voyage_id: int
    notes: str | None = None


# 🔹 CREATE
class ShipmentCreate(ShipmentBase):
    pass


# 🔹 UPDATE
class ShipmentUpdate(BaseModel):
    bl_number: str | None = None
    voyage_id: int | None = None
    notes: str | None = None


# 🔹 RESPONSE
class ShipmentResponse(BaseModel):
    id: int
    bl_number: str
    voyage_id: int
    notes: str | None = None

    created_at: datetime
    updated_at: datetime

    # 🔥 extras para frontend (clave para tu dashboard)
    vessel_name: str | None = None
    voyage_number: str | None = None

    model_config = ConfigDict(from_attributes=True)