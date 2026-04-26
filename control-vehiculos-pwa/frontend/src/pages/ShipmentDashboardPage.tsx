import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { ShipmentDashboard } from "../types/shipment";

export default function ShipmentDashboardPage() {
  const [items, setItems] = useState<ShipmentDashboard[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get<ShipmentDashboard[]>("/shipments/dashboard/summary");
      setItems(response.data);
    } catch (error) {
      console.error("Error cargando dashboard BL", error);
      alert("No se pudo cargar el dashboard por BL");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getPercent = (item: ShipmentDashboard) => {
    if (item.total_vehicles === 0) return 0;
    return Math.round((item.recepcionado / item.total_vehicles) * 100);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard por BL</h1>
          <p style={styles.subtitle}>
            Control de avance por embarque, faltantes, tránsito y recepcionados.
          </p>
        </div>

        <button style={styles.button} onClick={fetchDashboard}>
          Actualizar
        </button>
      </div>

      {loading ? <p>Cargando dashboard...</p> : null}

      <div style={styles.grid}>
        {items.map((item) => {
          const percent = getPercent(item);

          return (
            <div key={item.shipment_id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.bl}>{item.bl_number}</h2>
                  <p style={styles.meta}>
                    Nave: {item.vessel_name ?? "-"} · Origen: {item.origin ?? "-"}
                  </p>
                </div>

                <span style={styles.percent}>{percent}%</span>
              </div>

              <div style={styles.progressOuter}>
                <div style={{ ...styles.progressInner, width: `${percent}%` }} />
              </div>

              <div style={styles.stats}>
                <div style={styles.statBox}>
                  <strong>{item.total_vehicles}</strong>
                  <span>Total</span>
                </div>

                <div style={styles.statBox}>
                  <strong>{item.faltante}</strong>
                  <span>Faltantes</span>
                </div>

                <div style={styles.statBox}>
                  <strong>{item.en_transito}</strong>
                  <span>En tránsito</span>
                </div>

                <div style={styles.statBox}>
                  <strong>{item.recepcionado}</strong>
                  <span>Recepcionados</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && items.length === 0 ? (
        <div style={styles.empty}>No hay BL registrados todavía.</div>
      ) : null}
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
  button: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  bl: {
    margin: 0,
    fontSize: "22px",
  },
  meta: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  percent: {
    fontSize: "22px",
    fontWeight: 800,
  },
  progressOuter: {
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  progressInner: {
    height: "100%",
    background: "#111827",
    borderRadius: "999px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },
  statBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    textAlign: "center",
    fontSize: "13px",
  },
  empty: {
    background: "#fff",
    border: "1px dashed #d1d5db",
    borderRadius: "16px",
    padding: "24px",
    textAlign: "center",
    color: "#6b7280",
  },
};