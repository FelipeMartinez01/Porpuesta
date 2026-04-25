from datetime import datetime
from pydantic import BaseModel, ConfigDict


class VehicleEventResponse(BaseModel):
    id: int
    vehicle_id: int
    event_type: str
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)