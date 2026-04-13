from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile

UPLOAD_DIR = Path("uploads/vehicles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_vehicle_photo(file: UploadFile, vehicle_id: int) -> str:
    extension = Path(file.filename).suffix.lower()

    if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise ValueError("Formato no permitido. Usa JPG, JPEG, PNG o WEBP")

    vehicle_folder = UPLOAD_DIR / str(vehicle_id)
    vehicle_folder.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{extension}"
    file_path = vehicle_folder / filename

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    return str(file_path).replace("\\", "/")