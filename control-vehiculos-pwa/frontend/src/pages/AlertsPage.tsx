import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { AlertsResponse, VehicleAlert, SlotAlert } from "../types/alerts";

type AnyAlert = VehicleAlert | SlotAlert;

function isVehicleAlert(item: AnyAlert): item is VehicleAlert {
  return "vehicle_id" in item;
}

function getSeverityStyle(label: string): React.CSSProperties {
  if (label === "CRITICA") return { background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" };
  if (label === "ALTA") return { background: "#ffedd5", color: "#9a3412", borderColor: "#fed7aa" };
  if (label === "MEDIA") return { background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" };
  return { background: "#dbeafe", color: "#1e40af", borderColor: "#bfdbfe" };
}

export default function AlertsPage() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("TODAS");

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get<AlertsResponse>("/alerts/");
      setAlerts(response.data);
    } catch (error) {
      console.error("Error cargando alertas", error);
      alert("No se pudieron cargar las alertas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    const data = alerts?.all_alerts ?? [];

    if (severityFilter === "TODAS") return data;

    return data.filter((item) => item.severity.label === severityFilter);
  }, [alerts, severityFilter]);

  const goToVehicleHistory = (item: VehicleAlert) => {
    navigate(`/vehicles/${item.vehicle_id}/history`);
  };

  const goToMapWithVin = (item: VehicleAlert) => {
    navigate("/parking-map", {
      state: {
        searchVin: item.vin,
      },
    });
  };

  const goToDirectDispatch = (item: VehicleAlert) => {
    navigate("/dispatch-direct", {
      state: {
        searchVin: item.vin,
      },
    });
  };

  const goToYardDispatch = (item: VehicleAlert) => {
    navigate("/dispatch-yard", {
      state: {
        searchVin: item.vin,
      },
    });
  };

  const handleDispatchDirect = async (item: VehicleAlert) => {
    const confirmDispatch = confirm(`¿Despachar ahora el vehículo ${item.vin}?`);
    if (!confirmDispatch) return;

    try {
      await api.patch(`/vehicles/${item.vehicle_id}/status`, {
        status: "DESPACHADO",
      });

      alert("Vehículo despachado correctamente");
      await fetchAlerts();
    } catch (error) {
      console.error("Error despachando directo", error);
      alert("No se pudo despachar el vehículo");
    }
  };

  const handleCleanMap = async () => {
    const confirmClean = confirm(
      "¿Seguro que quieres limpiar inconsistencias del mapa? Esto dejará todos los slots disponibles y quitará asignaciones."
    );

    if (!confirmClean) return;

    try {
      await api.post("/parking-slots/reset");
      alert("Mapa limpiado correctamente");
      await fetchAlerts();
    } catch (error) {
      console.error("Error limpiando mapa", error);
      alert("No se pudo limpiar el mapa");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Alertas inteligentes</h1>
          <p style={styles.subtitle}>
            Priorización automática de riesgos operativos según severidad.
          </p>
        </div>

        <button style={styles.button} onClick={fetchAlerts}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div style={styles.kpiGrid}>
        <Kpi title="Total" value={alerts?.total_alerts ?? 0} background="#111827" color="#fff" />
        <Kpi title="Críticas" value={alerts?.critical_alerts ?? 0} background="#991b1b" color="#fff" />
        <Kpi title="Altas" value={alerts?.high_alerts ?? 0} background="#9a3412" color="#fff" />
        <Kpi title="Medias" value={alerts?.medium_alerts ?? 0} background="#92400e" color="#fff" />
        <Kpi title="Bajas" value={alerts?.low_alerts ?? 0} background="#1e40af" color="#fff" />
      </div>

      <div style={styles.filtersCard}>
        <label style={styles.label}>Filtrar por severidad</label>
        <select
          style={styles.select}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="TODAS">Todas</option>
          <option value="CRITICA">Crítica</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </select>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Alertas priorizadas</h2>

        {filteredAlerts.length === 0 ? (
          <div style={styles.empty}>Sin alertas para mostrar.</div>
        ) : (
          <div style={styles.list}>
            {filteredAlerts.map((item, index) => (
              <div
                key={`${item.alert_type}-${isVehicleAlert(item) ? item.vehicle_id : item.slot_id}-${index}`}
                style={{
                  ...styles.alertItem,
                  ...getSeverityStyle(item.severity.label),
                }}
              >
                <div style={styles.alertContent}>
                  <div style={styles.alertTop}>
                    <span
                      style={{
                        ...styles.severityBadge,
                        ...getSeverityStyle(item.severity.label),
                      }}
                    >
                      {item.severity.label}
                    </span>

                    <strong>{item.title}</strong>
                  </div>

                  <p style={styles.message}>{item.message}</p>
                  <p style={styles.suggested}>
                    Acción sugerida: <strong>{item.suggested_action}</strong>
                  </p>

                  {isVehicleAlert(item) ? (
                    <p style={styles.meta}>
                      VIN: <strong>{item.vin}</strong> · Estado: {item.status} · BL:{" "}
                      {item.shipment_bl ?? "-"} · Slot: {item.slot_id ?? "-"} ·{" "}
                      {item.hours_in_current_state} h
                    </p>
                  ) : (
                    <p style={styles.meta}>
                      Slot: <strong>{item.slot_code}</strong> · Sector:{" "}
                      {item.sector_id ?? "-"} · Estado: {item.visual_status}
                    </p>
                  )}
                </div>

                <div style={styles.actionGroup}>
                  {isVehicleAlert(item) ? (
                    <>
                      <button style={styles.smallButton} onClick={() => goToVehicleHistory(item)}>
                        Historial
                      </button>

                      <button style={styles.secondarySmallButton} onClick={() => goToMapWithVin(item)}>
                        Mapa
                      </button>

                      {item.alert_type === "DIRECT_PENDING" ? (
                        <button style={styles.successSmallButton} onClick={() => handleDispatchDirect(item)}>
                          Despachar
                        </button>
                      ) : null}

                      {item.status === "ALMACENADO" ? (
                        <button style={styles.secondarySmallButton} onClick={() => goToYardDispatch(item)}>
                          Despacho patio
                        </button>
                      ) : null}

                      {item.status === "DIRECTO" ? (
                        <button style={styles.secondarySmallButton} onClick={() => goToDirectDispatch(item)}>
                          Despacho directo
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button style={styles.dangerButton} onClick={handleCleanMap}>
                      Corregir mapa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  background,
  color,
}: {
  title: string;
  value: number;
  background: string;
  color: string;
}) {
  return (
    <div style={{ ...styles.kpiCard, background, color }}>
      <span>{title}</span>
      <strong>{value}</strong>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  kpiCard: {
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  filtersCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    marginBottom: "20px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  label: {
    fontWeight: 800,
  },
  select: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
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
    margin: 0,
    marginBottom: "16px",
  },
  empty: {
    padding: "16px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280",
    textAlign: "center",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  alertItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid",
    flexWrap: "wrap",
  },
  alertContent: {
    minWidth: "260px",
    flex: 1,
  },
  alertTop: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  severityBadge: {
    border: "1px solid",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "12px",
    fontWeight: 900,
  },
  message: {
    margin: "8px 0 0",
  },
  suggested: {
    margin: "6px 0 0",
    color: "#374151",
    fontSize: "13px",
  },
  meta: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },
  actionGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  smallButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondarySmallButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
  },
  successSmallButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};