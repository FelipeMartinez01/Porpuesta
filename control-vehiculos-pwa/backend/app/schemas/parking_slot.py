from pydantic import BaseModel, ConfigDict


class ParkingSlotResponse(BaseModel):
    id: int
    sector_id: int
    row_num: int
    col_num: int
    code: str
    visual_status: str

    model_config = ConfigDict(from_attributes=True)