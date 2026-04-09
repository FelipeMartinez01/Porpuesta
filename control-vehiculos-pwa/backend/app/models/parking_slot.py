from __future__ import annotations
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sector_id: Mapped[int] = mapped_column(ForeignKey("sectors.id"), nullable=False)
    row_num: Mapped[int] = mapped_column(nullable=False)
    col_num: Mapped[int] = mapped_column(nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    visual_status: Mapped[str] = mapped_column(String(20), nullable=False, default="DISPONIBLE")

    sector: Mapped["Sector"] = relationship(back_populates="slots")
    vehicle: Mapped["Vehicle | None"] = relationship(back_populates="slot", uselist=False)