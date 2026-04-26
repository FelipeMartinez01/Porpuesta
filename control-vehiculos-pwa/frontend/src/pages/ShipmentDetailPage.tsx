import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Shipment } from "../types/shipment";
import type { Vehicle } from "../types/vehicle";

function getStatusStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
    display: "inline-block",
  };

  if (status === "FALTANTE") return { ...base, background: "#fee2e2", color: "#991b1b" };
  if (status === "DIRECTO") return { ...base, background: "#dbeafe", color: "#1e40af" };
  if (status === "ALMACENADO") return { ...base, background: "#fef3c7", color: "#92400e" };
  if (status === "EN_TRANSITO") return { ...base, background: "#ede9fe", color: "#5b21b6" };
  if (status === "DESPACHADO") return { ...base, background: "#dcfce7", color: "#166534" };

  return { ...base, background: "#f3f4f6", color: "#374151" };
}

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    if (!shipmentId) return;

    try {
      setLoading(true);

      const [shipmentResponse, vehiclesResponse] = await Promise.all([
        api.get<Shipment>(`/shipments/${shipmentId}`),
        api.get<Vehicle[]>("/vehicles/", {
          params: { shipment_id: Number(shipmentId) },
        }),
      ]);

      setShipment(shipmentResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (error) {
      console.error("Error cargando detalle BL", error);
      alert("No se pudo cargar el detalle del BL");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [shipmentId]);

  return (
    <div style={styles.page}>
      <button style={styles.backButton} onClick={() => navigate("/shipments-dashboard")}>
        ← Volver al Dashboard BL
      </button>

      {loading ? <p>Cargando detalle...</p> : null}

      {shipment ? (
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Detalle BL: {shipment.bl_number}</h1>
          <p style={styles.subtitle}>
            Nave: {shipment.vessel_name ?? "-"} · Viaje: {shipment.voyage_number ?? "-"}
          </p>
        </div>
      ) : null}

      <div style={styles.summaryGrid}>
        <div style={styles.summaryBox}>
          <strong>{vehicles.length}</strong>
          <span>Total vehículos</span>
        </div>

        <div style={styles.summaryBox}>
          <strong>{vehicles.filter((v) => v.status === "FALTANTE").length}</strong>
          <span>Faltantes</span>
        </div>

        <div style={styles.summaryBox}>
          <strong>{vehicles.filter((v) => v.status === "DIRECTO").length}</strong>
          <span>Directo</span>
        </div>

        <div style={styles.summaryBox}>
          <strong>{vehicles.filter((v) => v.status === "ALMACENADO").length}</strong>
          <span>Almacenados</span>
        </div>

        <div style={styles.summaryBox}>
          <strong>{vehicles.filter((v) => v.status === "EN_TRANSITO").length}</strong>
          <span>En tránsito</span>
        </div>

        <div style={styles.summaryBox}>
          <strong>{vehicles.filter((v) => v.status === "DESPACHADO").length}</strong>
          <span>Despachados</span>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Vehículos asociados al BL</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>VIN</th>
                <th style={styles.th}>Marca</th>
                <th style={styles.th}>Modelo</th>
                <th style={styles.th}>Color</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Porteador</th>
                <th style={styles.th}>Sector</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td style={styles.emptyCell} colSpan={8}>
                    Este BL todavía no tiene vehículos asociados.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td style={styles.td}>{vehicle.id}</td>
                    <td style={styles.td}>{vehicle.vin}</td>
                    <td style={styles.td}>{vehicle.brand ?? "-"}</td>
                    <td style={styles.td}>{vehicle.model ?? "-"}</td>
                    <td style={styles.td}>{vehicle.color ?? "-"}</td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(vehicle.status)}>{vehicle.status}</span>
                    </td>
                    <td style={styles.td}>{vehicle.carrier_name ?? "-"}</td>
                    <td style={styles.td}>{vehicle.sector_name ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  backButton: {
    marginBottom: "16px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  headerCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  summaryBox: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    marginTop: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px",
    background: "#f9fafb",
    textAlign: "left",
    fontSize: "13px",
  },
  td: {
    borderBottom: "1px solid #f0f0f0",
    padding: "12px",
    fontSize: "14px",
  },
  emptyCell: {
    padding: "24px",
    textAlign: "center",
    color: "#6b7280",
  },
};