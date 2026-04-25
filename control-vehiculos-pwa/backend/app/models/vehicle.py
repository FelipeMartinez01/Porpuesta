from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.services.vehicle_event_service import create_vehicle_event



class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vin: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    barcode_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model: Mapped[str | None] = mapped_column(String(80), nullable=True)
    vehicle_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    carrier_id: Mapped[int | None] = mapped_column(ForeignKey("carriers.id"), nullable=True)
    sector_id: Mapped[int | None] = mapped_column(ForeignKey("sectors.id"), nullable=True)
    slot_id: Mapped[int | None] = mapped_column(ForeignKey("parking_slots.id"), nullable=True, unique=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="FALTANTE")
    photo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    carrier: Mapped["Carrier | None"] = relationship(back_populates="vehicles")
    sector: Mapped["Sector | None"] = relationship(back_populates="vehicles")
    slot: Mapped["ParkingSlot | None"] = relationship(back_populates="vehicle")
    photos: Mapped[list["VehiclePhoto"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")

    # relación con historial de eventos
    events: Mapped[list["VehicleEvent"]] = relationship(
        "VehicleEvent",
        back_populates="vehicle",
        cascade="all, delete-orphan"
    )