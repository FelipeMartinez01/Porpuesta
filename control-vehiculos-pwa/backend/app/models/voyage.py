from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Voyage(Base):
    __tablename__ = "voyages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    vessel_id: Mapped[int] = mapped_column(
        ForeignKey("vessels.id"),
        nullable=False,
        index=True,
    )

    voyage_number: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    origin: Mapped[str | None] = mapped_column(String(120), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(120), nullable=True)
    arrival_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    departure_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    vessel = relationship("Vessel", back_populates="voyages")
    shipments = relationship(
        "Shipment",
        back_populates="voyage",
        cascade="all, delete-orphan",
    )