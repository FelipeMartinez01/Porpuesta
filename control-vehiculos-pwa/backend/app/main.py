from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.models import Carrier, Sector, ParkingSlot, Vehicle, VehiclePhoto
from app.routers.carrier import router as carrier_router
from app.routers.sector import router as sector_router
from app.routers.vehicle import router as vehicle_router
from app.routers.upload import router as upload_router

app = FastAPI(title="Control Vehiculos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "API funcionando correctamente"}


app.include_router(carrier_router)
app.include_router(sector_router)
app.include_router(vehicle_router)
app.include_router(upload_router)