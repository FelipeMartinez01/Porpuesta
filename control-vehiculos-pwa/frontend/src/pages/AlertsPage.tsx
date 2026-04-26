import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { AlertsResponse, VehicleAlert, SlotAlert } from "../types/alerts";

export default function AlertsPage() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleGoToVehicleHistory = (item: VehicleAlert) => {
    navigate(`/vehicles/${item.vehicle_id}/history`);
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
            Detección automática de posibles problemas operativos en el patio.
          </p>
        </div>

        <button style={styles.button} onClick={fetchAlerts}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div style={styles.kpiCard}>
        <span>Total alertas activas</span>
        <strong>{alerts?.total_alerts ?? 0}</strong>
      </div>

      <AlertSection
        title="Vehículos en tránsito por más de 2 horas"
        description="Posible demora o vehículo pendiente de ubicación."
        items={alerts?.stuck_transit ?? []}
        actions={(item) => (
          <>
            <button style={styles.smallButton} onClick={() => goToMapWithVin(item)}>
              Ir al mapa
            </button>

            <button
              style={styles.secondarySmallButton}
              onClick={() => handleGoToVehicleHistory(item)}
            >
              Ver historial
            </button>
          </>
        )}
      />

      <AlertSection
        title="Vehículos almacenados por más de 3 días"
        description="Posible atraso logístico o unidad pendiente de despacho desde patio."
        items={alerts?.long_storage ?? []}
        actions={(item) => (
          <>
            <button style={styles.smallButton} onClick={() => goToYardDispatch(item)}>
              Despacho patio
            </button>

            <button style={styles.secondarySmallButton} onClick={() => goToMapWithVin(item)}>
              Ver en mapa
            </button>
          </>
        )}
      />

      <AlertSection
        title="Vehículos directos pendientes por más de 4 horas"
        description="Vehículos que deberían ser despachados rápidamente."
        items={alerts?.direct_pending ?? []}
        actions={(item) => (
          <>
            <button
              style={styles.successSmallButton}
              onClick={() => handleDispatchDirect(item)}
            >
              Despachar ahora
            </button>

            <button style={styles.secondarySmallButton} onClick={() => goToDirectDispatch(item)}>
              Ir a despacho
            </button>
          </>
        )}
      />

      <SlotSection
        title="Slots ocupados sin vehículo asociado"
        description="Inconsistencia entre mapa y asignación real."
        items={alerts?.slot_occupied_without_vehicle ?? []}
        onCleanMap={handleCleanMap}
      />
    </div>
  );
}

function AlertSection({
  title,
  description,
  items,
  actions,
}: {
  title: string;
  description: string;
  items: VehicleAlert[];
  actions: (item: VehicleAlert) => React.ReactNode;
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.sectionDescription}>{description}</p>

      {items.length === 0 ? (
        <div style={styles.empty}>Sin alertas.</div>
      ) : (
        <div style={styles.list}>
          {items.map((item) => (
            <div key={`${item.vehicle_id}-${item.status}`} style={styles.alertItem}>
              <div style={styles.alertContent}>
                <strong>{item.vin}</strong>
                <p style={styles.meta}>
                  {item.brand ?? "-"} {item.model ?? ""} · BL:{" "}
                  {item.shipment_bl ?? "-"}
                </p>
                <p style={styles.meta}>
                  Porteador: {item.carrier_name ?? "-"} · Sector:{" "}
                  {item.sector_name ?? "-"} · Slot: {item.slot_id ?? "-"}
                </p>
              </div>

              <div style={styles.rightActions}>
                <div style={styles.badge}>{item.hours_in_current_state} h</div>
                <div style={styles.actionGroup}>{actions(item)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotSection({
  title,
  description,
  items,
  onCleanMap,
}: {
  title: string;
  description: string;
  items: SlotAlert[];
  onCleanMap: () => void;
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.sectionDescription}>{description}</p>

      {items.length === 0 ? (
        <div style={styles.empty}>Sin inconsistencias.</div>
      ) : (
        <>
          <div style={styles.actionsTop}>
            <button style={styles.dangerButton} onClick={onCleanMap}>
              Limpiar mapa
            </button>
          </div>

          <div style={styles.list}>
            {items.map((item) => (
              <div key={item.slot_id} style={styles.alertItem}>
                <div>
                  <strong>Slot {item.slot_code}</strong>
                  <p style={styles.meta}>
                    Sector ID: {item.sector_id ?? "-"} · Estado:{" "}
                    {item.visual_status}
                  </p>
                </div>

                <div style={styles.badge}>Mapa</div>
              </div>
            ))}
          </div>
        </>
      )}
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
  kpiCard: {
    background: "#111827",
    color: "#fff",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "280px",
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
    marginBottom: "6px",
  },
  sectionDescription: {
    marginTop: 0,
    color: "#6b7280",
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
    gap: "10px",
  },
  alertItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    padding: "14px",
    borderRadius: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    flexWrap: "wrap",
  },
  alertContent: {
    minWidth: "240px",
    flex: 1,
  },
  meta: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  actionGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  badge: {
    background: "#991b1b",
    color: "#fff",
    borderRadius: "999px",
    padding: "8px 10px",
    fontWeight: 800,
    whiteSpace: "nowrap",
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
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  actionsTop: {
    marginBottom: "14px",
  },
};