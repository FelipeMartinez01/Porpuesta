import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Carrier, Sector } from "../types/catalogs";
import type { Shipment } from "../types/shipment";
import type { UploadResult } from "../types/upload";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [carrierId, setCarrierId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [shipmentId, setShipmentId] = useState("");

  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [uploading, setUploading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const fetchCatalogs = async () => {
    try {
      setLoadingCatalogs(true);

      const [carriersResponse, sectorsResponse, shipmentsResponse] =
        await Promise.all([
          api.get<Carrier[]>("/carriers/"),
          api.get<Sector[]>("/sectors/"),
          api.get<Shipment[]>("/shipments/"),
        ]);

      setCarriers(carriersResponse.data);
      setSectors(sectorsResponse.data);
      setShipments(shipmentsResponse.data);
    } catch (error) {
      console.error("Error cargando catálogos", error);
      alert("No se pudieron cargar porteadores, sectores o BL");
    } finally {
      setLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const selectedShipment = shipments.find((shipment) => String(shipment.id) === shipmentId);
  const selectedCarrier = carriers.find((carrier) => String(carrier.id) === carrierId);
  const selectedSector = sectors.find((sector) => String(sector.id) === sectorId);

  const handleUpload = async () => {
    if (!file) {
      alert("Debes seleccionar un archivo Excel o CSV");
      return;
    }

    if (!shipmentId) {
      alert("Debes seleccionar un BL");
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
          shipment_id: Number(shipmentId),
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      alert("Carga masiva finalizada");
    } catch (error) {
      console.error("Error subiendo archivo", error);
      alert("No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setCarrierId("");
    setSectorId("");
    setShipmentId("");
    setResult(null);

    const fileInput = document.getElementById("upload-file-input") as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Carga Masiva</h1>
          <p style={styles.subtitle}>
            Registra múltiples vehículos desde Excel o CSV y asígnalos automáticamente a un BL.
          </p>
        </div>

        <button style={styles.secondaryButton} onClick={fetchCatalogs} disabled={loadingCatalogs}>
          {loadingCatalogs ? "Actualizando..." : "Actualizar catálogos"}
        </button>
      </div>

      <div style={styles.layout}>
        <div>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Datos de la carga</h2>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Archivo *</label>
                <input
                  id="upload-file-input"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] ?? null;
                    setFile(selectedFile);
                    setResult(null);
                  }}
                />

                {file ? (
                  <small style={styles.helpText}>
                    Archivo seleccionado: <strong>{file.name}</strong>
                  </small>
                ) : (
                  <small style={styles.helpText}>Formatos permitidos: .xlsx o .csv</small>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>BL / Embarque *</label>
                <select
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Selecciona un BL</option>
                  {shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.bl_number} - {shipment.vessel_name ?? "Sin nave"} /{" "}
                      {shipment.voyage_number ?? "Sin viaje"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Porteador *</label>
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
                <label style={styles.label}>Sector *</label>
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
              <button style={styles.primaryButton} onClick={handleUpload} disabled={uploading}>
                {uploading ? "Subiendo..." : "Subir archivo"}
              </button>

              <button style={styles.secondaryButton} onClick={handleClear} disabled={uploading}>
                Limpiar
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Formato esperado del archivo</h2>

            <p style={styles.text}>
              El archivo debe contener al menos la columna <strong>vin</strong>. Las demás columnas
              son opcionales.
            </p>

            <div style={styles.codeBlock}>
              vin | color | brand | model | vehicle_year | notes
            </div>

            <div style={styles.tipBox}>
              <strong>Importante:</strong> El VIN será usado también como código de barra. El BL,
              porteador y sector se asignan desde los selectores superiores a todos los vehículos
              cargados.
            </div>
          </div>
        </div>

        <div>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Resumen previo</h2>

            <SummaryRow label="Archivo" value={file?.name ?? "No seleccionado"} />
            <SummaryRow label="BL" value={selectedShipment?.bl_number ?? "No seleccionado"} />
            <SummaryRow label="Nave" value={selectedShipment?.vessel_name ?? "-"} />
            <SummaryRow label="Viaje" value={selectedShipment?.voyage_number ?? "-"} />
            <SummaryRow label="Porteador" value={selectedCarrier?.name ?? "No seleccionado"} />
            <SummaryRow label="Sector" value={selectedSector?.name ?? "No seleccionado"} />
          </div>

          {result ? (
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Resultado de la carga</h2>

              <div style={styles.resultStats}>
                <div style={styles.resultBox}>
                  <strong>{result.created_count}</strong>
                  <span>Creados</span>
                </div>

                <div style={styles.resultBox}>
                  <strong>{result.errors_count}</strong>
                  <span>Errores</span>
                </div>
              </div>

              <div style={styles.resultSection}>
                <h3 style={styles.resultTitle}>VIN cargados</h3>
                {result.created.length === 0 ? (
                  <p style={styles.text}>No se cargaron VIN.</p>
                ) : (
                  <ul style={styles.list}>
                    {result.created.map((vin) => (
                      <li key={vin}>{vin}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={styles.resultSection}>
                <h3 style={styles.resultTitle}>Errores encontrados</h3>
                {result.errors.length === 0 ? (
                  <p style={styles.text}>Sin errores.</p>
                ) : (
                  <ul style={styles.errorList}>
                    {result.errors.map((error, index) => (
                      <li key={`${error}-${index}`}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.summaryRow}>
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>{value}</strong>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    marginBottom: "8px",
    fontSize: "32px",
  },
  subtitle: {
    margin: 0,
    color: "#6b7280",
  },
  layout: {
    display: "grid",
    gridTemplateColumns:
      window.innerWidth < 1000 ? "1fr" : "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
    gap: "20px",
    alignItems: "start",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "16px",
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
  helpText: {
    color: "#6b7280",
  },
  actions: {
    marginTop: "20px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
  },
  text: {
    color: "#374151",
    lineHeight: 1.5,
  },
  codeBlock: {
    padding: "12px",
    background: "#f3f4f6",
    borderRadius: "10px",
    fontFamily: "monospace",
    margin: "12px 0",
    overflowX: "auto",
  },
  tipBox: {
    padding: "14px",
    borderRadius: "12px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    lineHeight: 1.5,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 700,
  },
  summaryValue: {
    color: "#111827",
    textAlign: "right",
    wordBreak: "break-word",
  },
  resultStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "18px",
  },
  resultBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    textAlign: "center",
  },
  resultSection: {
    marginTop: "18px",
  },
  resultTitle: {
    marginBottom: "10px",
  },
  list: {
    paddingLeft: "20px",
    margin: 0,
  },
  errorList: {
    paddingLeft: "20px",
    margin: 0,
    color: "#991b1b",
  },
};