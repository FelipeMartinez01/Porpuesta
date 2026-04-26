import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { DashboardGeneralSummary } from "../types/dashboardGeneral";

export default function DashboardGeneralPage() {
  const [summary, setSummary] = useState<DashboardGeneralSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get<DashboardGeneralSummary>(
        "/dashboard-general/summary"
      );
      setSummary(response.data);
    } catch (error) {
      console.error("Error cargando dashboard general", error);
      alert("No se pudo cargar el dashboard general");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard General</h1>
          <p style={styles.subtitle}>
            Métricas globales del flujo operativo: recepción, despacho, patio y ocupación.
          </p>
        </div>

        <button style={styles.button} onClick={fetchSummary}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div style={styles.kpiGrid}>
        <KpiCard
          label="Total vehículos"
          value={summary?.total_vehicles ?? 0}
          description="Unidades registradas en el sistema"
        />

        <KpiCard
          label="% recepción"
          value={`${summary?.reception_percent ?? 0}%`}
          description="Vehículos ya clasificados o procesados"
        />

        <KpiCard
          label="% despacho"
          value={`${summary?.dispatch_percent ?? 0}%`}
          description="Vehículos despachados del puerto"
        />

        <KpiCard
          label="Vehículos en patio"
          value={summary?.vehicles_in_yard ?? 0}
          description="Unidades almacenadas actualmente"
        />

        <KpiCard
          label="Promedio en patio"
          value={`${summary?.average_yard_hours ?? 0} h`}
          description="Tiempo promedio de vehículos almacenados"
        />

        <KpiCard
          label="Ocupación patio"
          value={`${summary?.yard_occupancy_percent ?? 0}%`}
          description={`${summary?.occupied_slots ?? 0} de ${summary?.total_slots ?? 0} slots ocupados`}
        />
      </div>

      <div style={styles.gridTwo}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Distribución por estado</h2>

          <StatusRow
            label="Faltante"
            value={summary?.status_counts.faltante ?? 0}
            total={summary?.total_vehicles ?? 0}
          />

          <StatusRow
            label="Directo"
            value={summary?.status_counts.directo ?? 0}
            total={summary?.total_vehicles ?? 0}
          />

          <StatusRow
            label="Almacenado"
            value={summary?.status_counts.almacenado ?? 0}
            total={summary?.total_vehicles ?? 0}
          />

          <StatusRow
            label="En tránsito"
            value={summary?.status_counts.en_transito ?? 0}
            total={summary?.total_vehicles ?? 0}
          />

          <StatusRow
            label="Despachado"
            value={summary?.status_counts.despachado ?? 0}
            total={summary?.total_vehicles ?? 0}
          />
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Capacidad del patio</h2>

          <div style={styles.capacityBox}>
            <div>
              <span style={styles.capacityLabel}>Slots disponibles</span>
              <strong style={styles.capacityValue}>
                {summary?.available_slots ?? 0}
              </strong>
            </div>

            <div>
              <span style={styles.capacityLabel}>Slots ocupados</span>
              <strong style={styles.capacityValue}>
                {summary?.occupied_slots ?? 0}
              </strong>
            </div>
          </div>

          <div style={styles.progressOuter}>
            <div
              style={{
                ...styles.progressInner,
                width: `${summary?.yard_occupancy_percent ?? 0}%`,
              }}
            />
          </div>

          <p style={styles.note}>
            Esta métrica permite visualizar rápidamente la presión operativa del
            patio y la disponibilidad de espacios.
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div style={styles.kpiCard}>
      <span style={styles.kpiLabel}>{label}</span>
      <strong style={styles.kpiValue}>{value}</strong>
      <p style={styles.kpiDescription}>{description}</p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div style={styles.statusRow}>
      <div style={styles.statusTop}>
        <strong>{label}</strong>
        <span>
          {value} / {percent}%
        </span>
      </div>

      <div style={styles.progressOuter}>
        <div style={{ ...styles.progressInner, width: `${percent}%` }} />
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
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  kpiCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  kpiLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "8px",
    textTransform: "uppercase",
  },
  kpiValue: {
    display: "block",
    fontSize: "34px",
    color: "#111827",
    marginBottom: "8px",
  },
  kpiDescription: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
  },
  statusRow: {
    marginBottom: "16px",
  },
  statusTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
    fontSize: "14px",
  },
  progressOuter: {
    width: "100%",
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    background: "#111827",
    borderRadius: "999px",
  },
  capacityBox: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "14px",
    marginBottom: "18px",
  },
  capacityLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "6px",
  },
  capacityValue: {
    fontSize: "28px",
  },
  note: {
    marginBottom: 0,
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.5,
  },
};