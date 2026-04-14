import { useMemo, useState } from "react";
import { api } from "../api/client";

type Props = {
  vehicleId: number;
  onUploaded: () => void;
};

export default function VehiclePhotoUpload({ vehicleId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const handleUpload = async () => {
    if (!file) {
      alert("Selecciona o toma una imagen");
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
      <label style={styles.label}>Tomar o seleccionar foto</label>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null;
          setFile(selected);
        }}
      />

      {file && previewUrl ? (
        <div style={styles.previewBox}>
          <p style={styles.fileName}>Archivo: {file.name}</p>
          <img
            src={previewUrl}
            alt="Vista previa"
            style={styles.preview}
          />
        </div>
      ) : null}

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
  label: {
    fontSize: "13px",
    fontWeight: 700,
  },
  previewBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
  },
  fileName: {
    margin: 0,
    fontSize: "13px",
    color: "#4b5563",
  },
  preview: {
    width: "100%",
    maxWidth: "320px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    objectFit: "cover",
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