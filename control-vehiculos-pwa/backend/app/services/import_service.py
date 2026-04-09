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


def import_vehicles(file: UploadFile, db: Session, carrier_id: int, sector_id: int):
    df = read_file(file)

    created = []
    errors = []

    for index, row in df.iterrows():
        try:
            vin = str(row.get("vin")).strip()

            if not vin or vin == "nan":
                errors.append(f"Fila {index}: VIN vacío")
                continue

            # evitar duplicados
            existing = db.query(Vehicle).filter(Vehicle.vin == vin).first()
            if existing:
                errors.append(f"Fila {index}: VIN duplicado {vin}")
                continue

            vehicle = Vehicle(
                vin=vin,
                barcode_id=row.get("barcode_id"),
                color=row.get("color"),
                brand=row.get("brand"),
                model=row.get("model"),
                vehicle_year=row.get("vehicle_year"),
                carrier_id=carrier_id,
                sector_id=sector_id,
                status="FALTANTE"
            )

            db.add(vehicle)
            created.append(vin)

        except Exception as e:
            errors.append(f"Fila {index}: {str(e)}")

    db.commit()

    return {
        "created_count": len(created),
        "errors_count": len(errors),
        "created": created,
        "errors": errors
    }