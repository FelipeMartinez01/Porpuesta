import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { ShipmentDashboard } from "../types/shipment";

export default function ShipmentDashboardPage() {
  const navigate = useNavigate();

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

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += item.total_vehicles;
        acc.faltante += item.faltante;
        acc.directo += item.directo;
        acc.almacenado += item.almacenado;
        acc.enTransito += item.en_transito;
        acc.despachado += item.despachado;
        return acc;
      },
      {
        total: 0,
        faltante: 0,
        directo: 0,
        almacenado: 0,
        enTransito: 0,
        despachado: 0,
      }
    );
  }, [items]);

  const getPercent = (item: ShipmentDashboard) => {
    if (item.total_vehicles === 0) return 0;
    return Math.round((item.despachado / item.total_vehicles) * 100);
  };

  const getGlobalPercent = () => {
    if (totals.total === 0) return 0;
    return Math.round((totals.despachado / totals.total) * 100);
  };

  const getPending = (item: ShipmentDashboard) => {
    return item.total_vehicles - item.despachado;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard por BL</h1>
          <p style={styles.subtitle}>
            Control operacional por embarque: avance, pendientes, despacho y trazabilidad.
          </p>
        </div>

        <button style={styles.button} onClick={fetchDashboard}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>BL registrados</span>
          <strong style={styles.kpiValue}>{items.length}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Vehículos totales</span>
          <strong style={styles.kpiValue}>{totals.total}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Despachados</span>
          <strong style={styles.kpiValue}>{totals.despachado}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Pendientes</span>
          <strong style={styles.kpiValue}>{totals.total - totals.despachado}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Avance global</span>
          <strong style={styles.kpiValue}>{getGlobalPercent()}%</strong>
        </div>
      </div>

      {loading ? <p style={styles.loading}>Cargando dashboard...</p> : null}

      <div style={styles.grid}>
        {items.map((item) => {
          const percent = getPercent(item);
          const pending = getPending(item);

          return (
            <div key={item.shipment_id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.badge}>BL</span>
                  <h2 style={styles.bl}>{item.bl_number}</h2>
                  <p style={styles.meta}>
                    Nave: {item.vessel_name ?? "-"} · Origen: {item.origin ?? "-"}
                  </p>
                </div>

                <div style={styles.percentBox}>
                  <strong>{percent}%</strong>
                  <span>despachado</span>
                </div>
              </div>

              <div style={styles.progressOuter}>
                <div style={{ ...styles.progressInner, width: `${percent}%` }} />
              </div>

              <div style={styles.miniSummary}>
                <span>
                  Pendientes: <strong>{pending}</strong>
                </span>
                <span>
                  Total: <strong>{item.total_vehicles}</strong>
                </span>
              </div>

              <div style={styles.stats}>
                <div style={{ ...styles.statBox, ...styles.redBox }}>
                  <strong>{item.faltante}</strong>
                  <span>Faltantes</span>
                </div>

                <div style={{ ...styles.statBox, ...styles.blueBox }}>
                  <strong>{item.directo}</strong>
                  <span>Directo</span>
                </div>

                <div style={{ ...styles.statBox, ...styles.yellowBox }}>
                  <strong>{item.almacenado}</strong>
                  <span>Almacenado</span>
                </div>

                <div style={{ ...styles.statBox, ...styles.purpleBox }}>
                  <strong>{item.en_transito}</strong>
                  <span>En tránsito</span>
                </div>

                <div style={{ ...styles.statBox, ...styles.greenBox }}>
                  <strong>{item.despachado}</strong>
                  <span>Despachado</span>
                </div>
              </div>

              <button
                style={styles.detailButton}
                onClick={() => navigate(`/shipments/${item.shipment_id}`)}
              >
                Ver detalle BL
              </button>
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
  loading: {
    color: "#6b7280",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  kpiCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  kpiLabel: {
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 700,
  },
  kpiValue: {
    fontSize: "30px",
    color: "#111827",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  badge: {
    display: "inline-block",
    background: "#111827",
    color: "#fff",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "8px",
  },
  bl: {
    margin: 0,
    fontSize: "24px",
  },
  meta: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  percentBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "10px 12px",
    textAlign: "center",
    minWidth: "90px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "12px",
    color: "#6b7280",
  },
  progressOuter: {
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressInner: {
    height: "100%",
    background: "#111827",
    borderRadius: "999px",
  },
  miniSummary: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "16px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
    gap: "10px",
  },
  statBox: {
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    textAlign: "center",
    fontSize: "13px",
    border: "1px solid transparent",
  },
  redBox: {
    background: "#fef2f2",
    borderColor: "#fecaca",
    color: "#991b1b",
  },
  blueBox: {
    background: "#eff6ff",
    borderColor: "#bfdbfe",
    color: "#1e40af",
  },
  yellowBox: {
    background: "#fffbeb",
    borderColor: "#fde68a",
    color: "#92400e",
  },
  purpleBox: {
    background: "#f5f3ff",
    borderColor: "#ddd6fe",
    color: "#5b21b6",
  },
  greenBox: {
    background: "#f0fdf4",
    borderColor: "#bbf7d0",
    color: "#166534",
  },
  detailButton: {
    marginTop: "16px",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    width: "100%",
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