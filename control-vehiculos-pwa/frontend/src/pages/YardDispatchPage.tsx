import { useEffect, useState } from "react";
import { api } from "../api/client";
import VinScanner from "../components/VinScanner";
import type { Vehicle } from "../types/vehicle";

export default function YardDispatchPage() {
  const [searchValue, setSearchValue] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const fetchStoredVehicles = async (vinValue: string = "") => {
    try {
      setLoading(true);

      const params: Record<string, string> = {
        status: "ALMACENADO",
      };

      if (vinValue.trim()) {
        params.vin = vinValue.trim();
      }

      const response = await api.get<Vehicle[]>("/vehicles/", { params });
      setVehicles(response.data);

      if (response.data.length === 1) {
        setSelectedVehicle(response.data[0]);
      } else {
        setSelectedVehicle(null);
      }
    } catch (error) {
      console.error("Error buscando vehículos almacenados", error);
      alert("No se pudieron cargar los vehículos almacenados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoredVehicles();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStoredVehicles(searchValue);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  const handleOpenScanner = () => {
    const isSecure =
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      alert("La cámara en vivo requiere HTTPS. Por ahora usa búsqueda manual por VIN.");
      return;
    }

    setScannerOpen(true);
  };

  const handleDetected = async (decodedText: string) => {
    setScannerOpen(false);
    setSearchValue(decodedText);
    await fetchStoredVehicles(decodedText);
  };

  const handleDispatch = async () => {
    if (!selectedVehicle) {
      alert("Selecciona un vehículo para despachar");
      return;
    }

    const confirmed = confirm(
      `¿Confirmas despachar desde patio el vehículo con VIN ${selectedVehicle.vin}?`
    );

    if (!confirmed) return;

    try {
      setDispatching(true);

      await api.patch(`/vehicles/${selectedVehicle.id}/status`, {
        status: "EN_TRANSITO",
      });

      await api.patch(`/vehicles/${selectedVehicle.id}/status`, {
        status: "DESPACHADO",
      });

      alert("Vehículo despachado correctamente y slot liberado");

      setSearchValue("");
      setSelectedVehicle(null);
      await fetchStoredVehicles();
    } catch (error) {
      console.error("Error despachando vehículo desde patio", error);
      alert("No se pudo despachar el vehículo desde patio");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Despacho desde Patio</h1>
          <p style={styles.subtitle}>
            Busca vehículos ALMACENADOS por VIN parcial o cámara, despáchalos y libera su ubicación.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.searchRow}>
          <div style={styles.field}>
            <label style={styles.label}>Buscar VIN</label>
            <input
              style={styles.input}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Ingresa o escanea parte del VIN"
              autoFocus
            />
          </div>

          <button style={styles.scanButton} onClick={handleOpenScanner}>
            Abrir cámara
          </button>
        </div>

        {loading ? <p style={styles.loading}>Buscando vehículos...</p> : null}
      </div>

      {scannerOpen ? (
        <VinScanner onDetected={handleDetected} onClose={() => setScannerOpen(false)} />
      ) : null}

      <div style={styles.layout}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Coincidencias ALMACENADO</h2>

          {vehicles.length === 0 ? (
            <div style={styles.empty}>
              No hay vehículos almacenados que coincidan con la búsqueda.
            </div>
          ) : (
            <div style={styles.list}>
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  style={{
                    ...styles.vehicleItem,
                    ...(selectedVehicle?.id === vehicle.id ? styles.vehicleItemActive : {}),
                  }}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <strong>{vehicle.vin}</strong>
                  <span>
                    {vehicle.brand ?? "-"} {vehicle.model ?? ""}
                  </span>
                  <small>
                    BL: {vehicle.shipment_bl ?? "-"} · Sector: {vehicle.sector_name ?? "-"} · Slot:{" "}
                    {vehicle.slot_id ?? "-"}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Detalle para despacho</h2>

          {!selectedVehicle ? (
            <div style={styles.empty}>Selecciona un vehículo de la lista.</div>
          ) : (
            <>
              <div style={styles.detailGrid}>
                <Detail label="VIN" value={selectedVehicle.vin} />
                <Detail label="Estado" value={selectedVehicle.status} />
                <Detail label="BL" value={selectedVehicle.shipment_bl ?? "-"} />
                <Detail label="Marca" value={selectedVehicle.brand ?? "-"} />
                <Detail label="Modelo" value={selectedVehicle.model ?? "-"} />
                <Detail label="Color" value={selectedVehicle.color ?? "-"} />
                <Detail label="Porteador" value={selectedVehicle.carrier_name ?? "-"} />
                <Detail label="Sector" value={selectedVehicle.sector_name ?? "-"} />
                <Detail label="Slot ID" value={String(selectedVehicle.slot_id ?? "-")} />
              </div>

              <button
                style={styles.dispatchButton}
                onClick={handleDispatch}
                disabled={dispatching}
              >
                {dispatching ? "Despachando..." : "Despachar y liberar slot"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={styles.detailValue}>{value}</strong>
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
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  searchRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "12px",
    alignItems: "end",
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
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },
  scanButton: {
    padding: "13px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  loading: {
    color: "#6b7280",
    marginBottom: 0,
  },
  layout: {
    display: "grid",
    gridTemplateColumns:
      window.innerWidth < 980 ? "1fr" : "minmax(0, 1.4fr) minmax(320px, 0.8fr)",
    gap: "20px",
    alignItems: "start",
  },
  sectionTitle: {
    marginTop: 0,
  },
  empty: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280",
    textAlign: "center",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  vehicleItem: {
    textAlign: "left",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  vehicleItemActive: {
    border: "2px solid #111827",
    background: "#f9fafb",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  detailItem: {
    padding: "12px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  detailLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#111827",
    wordBreak: "break-word",
  },
  dispatchButton: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "15px",
  },
};