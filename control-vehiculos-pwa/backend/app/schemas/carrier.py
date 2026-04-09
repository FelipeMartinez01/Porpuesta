from pydantic import BaseModel, ConfigDict, EmailStr


class CarrierBase(BaseModel):
    name: str
    rut: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class CarrierCreate(CarrierBase):
    pass


class CarrierUpdate(BaseModel):
    name: str | None = None
    rut: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class CarrierResponse(CarrierBase):
    id: int

    model_config = ConfigDict(from_attributes=True)