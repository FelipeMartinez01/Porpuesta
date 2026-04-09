from __future__ import annotations
from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Sector(Base):
    __tablename__ = "sectors"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    vehicles: Mapped[List["Vehicle"]] = relationship(back_populates="sector")
    slots: Mapped[List["ParkingSlot"]] = relationship(back_populates="sector")