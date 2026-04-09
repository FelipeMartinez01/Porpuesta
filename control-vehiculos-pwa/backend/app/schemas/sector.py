from pydantic import BaseModel, ConfigDict


class SectorBase(BaseModel):
    name: str
    description: str | None = None


class SectorCreate(SectorBase):
    pass


class SectorUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class SectorResponse(SectorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)