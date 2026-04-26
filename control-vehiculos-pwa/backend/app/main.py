from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine
from app.models import (
    Carrier,
    Sector,
    ParkingSlot,
    Vehicle,
    VehiclePhoto,
    VehicleEvent,
    Shipment,
    Vessel,
    Voyage,
    User,
)

from app.routers.carrier import router as carrier_router
from app.routers.sector import router as sector_router
from app.routers.vehicle import router as vehicle_router
from app.routers.upload import router as upload_router
from app.routers.parking_slot import router as parking_slot_router
from app.routers.vehicle_photo import router as vehicle_photo_router
from app.routers.shipment import router as shipment_router
from app.routers.vessel import router as vessel_router
from app.routers.voyage import router as voyage_router
from app.routers.alert import router as alert_router
from app.routers.dashboard_general import router as dashboard_general_router
from app.routers.auth import router as auth_router

app = FastAPI(title="Control Vehiculos API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "API funcionando correctamente"}


app.include_router(auth_router)
app.include_router(carrier_router)
app.include_router(sector_router)
app.include_router(vehicle_router)
app.include_router(upload_router)
app.include_router(parking_slot_router)
app.include_router(vehicle_photo_router)
app.include_router(shipment_router)
app.include_router(vessel_router)
app.include_router(voyage_router)
app.include_router(alert_router)
app.include_router(dashboard_general_router)