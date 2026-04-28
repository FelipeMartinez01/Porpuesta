import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client";
import VinScanner from "../components/VinScanner";
import type { Vehicle } from "../types/vehicle";

export default function DirectDispatchPage() {
  const location = useLocation();
  const initialSearchVin =
    (location.state as { searchVin?: string } | null)?.searchVin ?? "";

  const [searchValue, setSearchValue] = useState(initialSearchVin);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const getLocationText = (vehicle: Vehicle) => {
    if (vehicle.location_label) {
      return vehicle.location_label;
    }

    if (vehicle.sector_name && vehicle.slot_code) {
      return `${vehicle.sector_name} - ${vehicle.slot_code}`;
    }

    if (vehicle.slot_code) {
      return vehicle.slot_code;
    }

    return "-";
  };

  const fetchDispatchableVehicles = async (vinValue: string = "") => {
    try {
      setLoading(true);

      const params: Record<string, string> = {};

      if (vinValue.trim()) {
        params.vin = vinValue.trim();
      }

      const [directResponse, transitResponse] = await Promise.all([
        api.get<Vehicle[]>("/vehicles/", {
          params: { ...params, status: "DIRECTO" },
        }),
        api.get<Vehicle[]>("/vehicles/", {
          params: { ...params, status: "EN_TRANSITO" },
        }),
      ]);

      const merged = [...directResponse.data, ...transitResponse.data];

      setVehicles(merged);

      if (merged.length === 1) {
        setSelectedVehicle(merged[0]);
      } else {
        setSelectedVehicle(null);
      }
    } catch (error) {
      console.error("Error buscando vehículos para despacho", error);
      alert("No se pudieron cargar los vehículos para despacho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchableVehicles(initialSearchVin);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchDispatchableVehicles(searchValue);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  const handleOpenScanner = () => {
    setScannerOpen(true);
  };

  const handleDetected = async (decodedText: string) => {
    setScannerOpen(false);
    setSearchValue(decodedText);
    await fetchDispatchableVehicles(decodedText);
  };

  const handleDispatch = async () => {
    if (!selectedVehicle) {
      alert("Selecciona un vehículo para despachar");
      return;
    }

    const confirmed = confirm(
      `¿Confirmas despachar el vehículo con VIN ${selectedVehicle.vin}?`
    );

    if (!confirmed) return;

    try {
      setDispatching(true);

      await api.patch(`/vehicles/${selectedVehicle.id}/status`, {
        status: "DESPACHADO",
      });

      alert("Vehículo despachado correctamente");

      setSearchValue("");
      setSelectedVehicle(null);
      await fetchDispatchableVehicles();
    } catch (error) {
      console.error("Error despachando vehículo", error);
      alert("No se pudo despachar el vehículo");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Despacho Directo / Tránsito</h1>
          <p style={styles.subtitle}>
            Busca vehículos en estado DIRECTO o EN_TRANSITO por VIN parcial o
            cámara y márcalos como despachados.
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
        <VinScanner
          onDetected={handleDetected}
          onClose={() => setScannerOpen(false)}
        />
      ) : null}

      <div style={styles.layout}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Coincidencias DIRECTO / EN_TRANSITO</h2>

          {vehicles.length === 0 ? (
            <div style={styles.empty}>
              No hay vehículos directos o en tránsito que coincidan con la
              búsqueda.
            </div>
          ) : (
            <div style={styles.list}>
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  style={{
                    ...styles.vehicleItem,
                    ...(selectedVehicle?.id === vehicle.id
                      ? styles.vehicleItemActive
                      : {}),
                  }}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <strong>{vehicle.vin}</strong>

                  <span>
                    {vehicle.brand ?? "-"} {vehicle.model ?? ""}
                  </span>

                  <small>
                    Estado: {vehicle.status} · BL:{" "}
                    {vehicle.shipment_bl ?? "-"} · Nave:{" "}
                    {vehicle.vessel_name ?? "-"} · Viaje:{" "}
                    {vehicle.voyage_number ?? "-"} · Porteador:{" "}
                    {vehicle.carrier_name ?? "-"} · Ubicación:{" "}
                    {getLocationText(vehicle)}
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
                <Detail label="Nave" value={selectedVehicle.vessel_name ?? "-"} />
                <Detail label="Viaje" value={selectedVehicle.voyage_number ?? "-"} />
                <Detail label="Marca" value={selectedVehicle.brand ?? "-"} />
                <Detail label="Modelo" value={selectedVehicle.model ?? "-"} />
                <Detail label="Color" value={selectedVehicle.color ?? "-"} />
                <Detail
                  label="Porteador"
                  value={selectedVehicle.carrier_name ?? "-"}
                />
                <Detail
                  label="Ubicación"
                  value={getLocationText(selectedVehicle)}
                />
              </div>

              <button
                style={styles.dispatchButton}
                onClick={handleDispatch}
                disabled={dispatching}
              >
                {dispatching ? "Despachando..." : "Despachar vehículo"}
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

const styles: Record<string, CSSProperties> = {
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
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
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