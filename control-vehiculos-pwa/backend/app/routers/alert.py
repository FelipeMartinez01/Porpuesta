from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.parking_slot import ParkingSlot

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def hours_between(start: datetime | None, end: datetime) -> int:
    if not start:
        return 0

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)

    return int((end - start).total_seconds() // 3600)


def severity(level: str):
    styles = {
        "CRITICA": 4,
        "ALTA": 3,
        "MEDIA": 2,
        "BAJA": 1,
    }

    return {
        "label": level,
        "priority": styles.get(level, 1),
    }


def vehicle_alert(
    vehicle: Vehicle,
    now: datetime,
    alert_type: str,
    severity_level: str,
    title: str,
    message: str,
    suggested_action: str,
):
    return {
        "alert_type": alert_type,
        "severity": severity(severity_level),
        "title": title,
        "message": message,
        "suggested_action": suggested_action,
        "vehicle_id": vehicle.id,
        "vin": vehicle.vin,
        "status": vehicle.status,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "carrier_name": vehicle.carrier.name if vehicle.carrier else None,
        "sector_name": vehicle.sector.name if vehicle.sector else None,
        "shipment_bl": vehicle.shipment.bl_number if vehicle.shipment else None,
        "slot_id": vehicle.slot_id,
        "hours_in_current_state": hours_between(vehicle.updated_at, now),
    }


def slot_alert(
    slot: ParkingSlot,
    alert_type: str,
    severity_level: str,
    title: str,
    message: str,
    suggested_action: str,
):
    return {
        "alert_type": alert_type,
        "severity": severity(severity_level),
        "title": title,
        "message": message,
        "suggested_action": suggested_action,
        "slot_id": slot.id,
        "slot_code": slot.code,
        "sector_id": slot.sector_id,
        "visual_status": slot.visual_status,
    }


@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    vehicles = (
        db.query(Vehicle)
        .options(
            joinedload(Vehicle.carrier),
            joinedload(Vehicle.sector),
            joinedload(Vehicle.shipment),
        )
        .all()
    )

    stuck_transit = []
    long_storage = []
    direct_pending = []
    missing_bl = []
    missing_photo = []
    incomplete_data = []
    stored_without_slot = []
    slot_occupied_without_vehicle = []
    all_alerts = []

    for vehicle in vehicles:
        hours = hours_between(vehicle.updated_at, now)

        if vehicle.status == "EN_TRANSITO" and hours >= 2:
            item = vehicle_alert(
                vehicle,
                now,
                "STUCK_TRANSIT",
                "ALTA",
                "Vehículo en tránsito detenido",
                f"El vehículo {vehicle.vin} lleva {hours} horas en tránsito.",
                "Revisar ubicación en mapa o completar despacho.",
            )
            stuck_transit.append(item)
            all_alerts.append(item)

        if vehicle.status == "ALMACENADO" and hours >= 72:
            item = vehicle_alert(
                vehicle,
                now,
                "LONG_STORAGE",
                "MEDIA",
                "Vehículo almacenado por demasiado tiempo",
                f"El vehículo {vehicle.vin} lleva {hours} horas almacenado.",
                "Revisar si corresponde despacho desde patio.",
            )
            long_storage.append(item)
            all_alerts.append(item)

        if vehicle.status == "DIRECTO" and hours >= 4:
            item = vehicle_alert(
                vehicle,
                now,
                "DIRECT_PENDING",
                "ALTA",
                "Vehículo directo pendiente",
                f"El vehículo {vehicle.vin} lleva {hours} horas como DIRECTO.",
                "Despachar o revisar retención documental.",
            )
            direct_pending.append(item)
            all_alerts.append(item)

        if not vehicle.shipment_id:
            item = vehicle_alert(
                vehicle,
                now,
                "MISSING_BL",
                "MEDIA",
                "Vehículo sin BL asociado",
                f"El vehículo {vehicle.vin} no tiene BL asociado.",
                "Asociar vehículo a BL/nave/viaje.",
            )
            missing_bl.append(item)
            all_alerts.append(item)

        if not vehicle.photo_url and vehicle.status != "FALTANTE":
            item = vehicle_alert(
                vehicle,
                now,
                "MISSING_PHOTO",
                "BAJA",
                "Vehículo sin foto de recepción",
                f"El vehículo {vehicle.vin} no tiene foto registrada.",
                "Agregar evidencia fotográfica.",
            )
            missing_photo.append(item)
            all_alerts.append(item)

        missing_fields = []
        if not vehicle.brand:
            missing_fields.append("marca")
        if not vehicle.model:
            missing_fields.append("modelo")
        if not vehicle.color:
            missing_fields.append("color")

        if missing_fields:
            item = vehicle_alert(
                vehicle,
                now,
                "INCOMPLETE_DATA",
                "BAJA",
                "Datos incompletos",
                f"El vehículo {vehicle.vin} tiene datos faltantes: {', '.join(missing_fields)}.",
                "Completar datos del vehículo.",
            )
            item["missing_fields"] = missing_fields
            incomplete_data.append(item)
            all_alerts.append(item)

        if vehicle.status == "ALMACENADO" and vehicle.slot_id is None:
            item = vehicle_alert(
                vehicle,
                now,
                "STORED_WITHOUT_SLOT",
                "CRITICA",
                "Vehículo almacenado sin ubicación",
                f"El vehículo {vehicle.vin} está ALMACENADO pero no tiene slot.",
                "Asignar ubicación en el patio inmediatamente.",
            )
            stored_without_slot.append(item)
            all_alerts.append(item)

    occupied_slots = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.visual_status == "OCUPADO")
        .all()
    )

    for slot in occupied_slots:
        vehicle = db.query(Vehicle).filter(Vehicle.slot_id == slot.id).first()

        if not vehicle:
            item = slot_alert(
                slot,
                "OCCUPIED_SLOT_WITHOUT_VEHICLE",
                "CRITICA",
                "Slot ocupado sin vehículo",
                f"El slot {slot.code} figura ocupado, pero no tiene vehículo asociado.",
                "Liberar slot o corregir asignación.",
            )
            slot_occupied_without_vehicle.append(item)
            all_alerts.append(item)

    all_alerts = sorted(
        all_alerts,
        key=lambda item: item["severity"]["priority"],
        reverse=True,
    )

    return {
        "total_alerts": len(all_alerts),
        "critical_alerts": len(
            [item for item in all_alerts if item["severity"]["label"] == "CRITICA"]
        ),
        "high_alerts": len(
            [item for item in all_alerts if item["severity"]["label"] == "ALTA"]
        ),
        "medium_alerts": len(
            [item for item in all_alerts if item["severity"]["label"] == "MEDIA"]
        ),
        "low_alerts": len(
            [item for item in all_alerts if item["severity"]["label"] == "BAJA"]
        ),
        "all_alerts": all_alerts,
        "stuck_transit": stuck_transit,
        "long_storage": long_storage,
        "direct_pending": direct_pending,
        "missing_bl": missing_bl,
        "missing_photo": missing_photo,
        "incomplete_data": incomplete_data,
        "stored_without_slot": stored_without_slot,
        "slot_occupied_without_vehicle": slot_occupied_without_vehicle,
    }