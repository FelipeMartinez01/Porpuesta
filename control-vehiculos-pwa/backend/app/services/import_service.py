import pandas as pd
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle


def read_file(file: UploadFile):
    filename = file.filename.lower()

    if filename.endswith(".xlsx"):
        df = pd.read_excel(file.file)
    elif filename.endswith(".csv"):
        df = pd.read_csv(file.file)
    else:
        raise ValueError("Formato no soportado. Usa Excel o CSV")

    return df


def clean_value(value):
    if pd.isna(value):
        return None
    return value


def import_vehicles(file: UploadFile, db: Session, carrier_id: int, sector_id: int):
    df = read_file(file)

    if "vin" not in df.columns:
        raise ValueError("El archivo debe contener una columna llamada 'vin'")

    created = []
    errors = []

    for index, row in df.iterrows():
        try:
            vin = str(clean_value(row.get("vin"))).strip() if clean_value(row.get("vin")) is not None else None

            if not vin:
                errors.append(f"Fila {index + 2}: VIN vacío")
                continue

            existing = db.query(Vehicle).filter(Vehicle.vin == vin).first()
            if existing:
                errors.append(f"Fila {index + 2}: VIN duplicado {vin}")
                continue

            vehicle_year = clean_value(row.get("vehicle_year"))
            if vehicle_year is not None:
                try:
                    vehicle_year = int(vehicle_year)
                except Exception:
                    vehicle_year = None

            vehicle = Vehicle(
                vin=vin,
                barcode_id=vin,
                color=clean_value(row.get("color")),
                brand=clean_value(row.get("brand")),
                model=clean_value(row.get("model")),
                vehicle_year=vehicle_year,
                carrier_id=carrier_id,
                sector_id=sector_id,
                status="FALTANTE"
            )

            db.add(vehicle)
            created.append(vin)

        except Exception as e:
            errors.append(f"Fila {index + 2}: {str(e)}")

    db.commit()

    return {
        "created_count": len(created),
        "errors_count": len(errors),
        "created": created,
        "errors": errors
    }