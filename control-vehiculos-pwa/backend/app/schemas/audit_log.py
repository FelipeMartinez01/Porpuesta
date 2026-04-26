from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    username: str | None = None
    action: str
    entity: str | None = None
    entity_id: str | None = None
    description: str
    extra_data: dict | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)