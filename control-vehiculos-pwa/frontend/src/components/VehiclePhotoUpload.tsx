import { useState } from "react";
import { api } from "../api/client";

type Props = {
  vehicleId: number;
  onUploaded: () => void;
};

export default function VehiclePhotoUpload({ vehicleId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Selecciona una imagen");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/vehicle-photos/${vehicleId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Foto subida correctamente");
      setFile(null);
      onUploaded();
    } catch (error) {
      console.error("Error subiendo foto", error);
      alert("No se pudo subir la foto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null;
          setFile(selected);
        }}
      />

      <button style={styles.button} onClick={handleUpload} disabled={loading}>
        {loading ? "Subiendo..." : "Subir foto"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },
  button: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    width: "fit-content",
  },
};