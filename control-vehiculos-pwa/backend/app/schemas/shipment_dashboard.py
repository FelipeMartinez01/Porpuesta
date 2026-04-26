from pydantic import BaseModel


class ShipmentDashboardResponse(BaseModel):
    shipment_id: int
    bl_number: str
    vessel_name: str | None = None
    origin: str | None = None

    total_vehicles: int
    faltante: int
    en_transito: int
    recepcionado: int