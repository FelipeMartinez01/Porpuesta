from pydantic import BaseModel


class ShipmentDashboardResponse(BaseModel):
    shipment_id: int
    bl_number: str
    vessel_name: str | None = None
    origin: str | None = None

    total_vehicles: int

    faltante: int
    directo: int
    almacenado: int
    en_transito: int = 0
    despachado: int = 0