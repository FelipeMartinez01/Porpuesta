import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Carrier, Sector } from "../types/catalogs";
import type { UploadResult } from "../types/upload";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [carrierId, setCarrierId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const fetchCatalogs = async () => {
    try {
      const [carriersResponse, sectorsResponse] = await Promise.all([
        api.get<Carrier[]>("/carriers/"),
        api.get<Sector[]>("/sectors/"),
      ]);

      setCarriers(carriersResponse.data);
      setSectors(sectorsResponse.data);
    } catch (error) {
      console.error("Error cargando catálogos", error);
      alert("No se pudieron cargar porteadores o sectores");
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      alert("Debes seleccionar un archivo");
      return;
    }

    if (!carrierId) {
      alert("Debes seleccionar un porteador");
      return;
    }

    if (!sectorId) {
      alert("Debes seleccionar un sector");
      return;
    }

    try {
      setUploading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<UploadResult>("/upload/vehicles", formData, {
        params: {
          carrier_id: Number(carrierId),
          sector_id: Number(sectorId),
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
    } catch (error) {
      console.error("Error subiendo archivo", error);
      alert("No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Carga Masiva</h1>
      <p style={styles.subtitle}>
        Sube un archivo Excel o CSV para registrar múltiples vehículos.
      </p>

      <div style={styles.card}>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Archivo</label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] ?? null;
                setFile(selectedFile);
              }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Porteador</label>
            <select
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              style={styles.input}
            >
              <option value="">Selecciona un porteador</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Sector</label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              style={styles.input}
            >
              <option value="">Selecciona un sector</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir archivo"}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Formato esperado del archivo</h2>
        <p>Tu archivo debe tener columnas como estas:</p>
        <div style={styles.codeBlock}>
          vin | color | brand | model | vehicle_year
        </div>
        <p>
          La columna <strong>vin</strong> es obligatoria y será usada también como código de barra.
        </p>
      </div>

      {result ? (
        <div style={styles.resultGrid}>
          <div style={styles.resultCard}>
            <h3>Resumen de carga</h3>
            <p><strong>Vehículos creados:</strong> {result.created_count}</p>
            <p><strong>Errores:</strong> {result.errors_count}</p>
          </div>

          <div style={styles.resultCard}>
            <h3>VIN cargados</h3>
            {result.created.length === 0 ? (
              <p>No se cargaron VIN.</p>
            ) : (
              <ul style={styles.list}>
                {result.created.map((vin) => (
                  <li key={vin}>{vin}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={styles.resultCard}>
            <h3>Errores encontrados</h3>
            {result.errors.length === 0 ? (
              <p>Sin errores.</p>
            ) : (
              <ul style={styles.list}>
                {result.errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
  },
  title: {
    margin: 0,
    marginBottom: "8px",
    fontSize: "32px",
  },
  subtitle: {
    margin: 0,
    marginBottom: "20px",
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
  },
  input: {
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    background: "#fff",
  },
  actions: {
    marginTop: "20px",
  },
  button: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  sectionTitle: {
    marginTop: 0,
  },
  codeBlock: {
    padding: "12px",
    background: "#f3f4f6",
    borderRadius: "10px",
    fontFamily: "monospace",
    margin: "12px 0",
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  resultCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  list: {
    paddingLeft: "20px",
    margin: 0,
  },
};