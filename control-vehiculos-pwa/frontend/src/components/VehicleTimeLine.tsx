import type { VehicleEvent } from "../types/vehicleEvent";

type Props = {
  events: VehicleEvent[];
};

function getEventLabel(eventType: string) {
  if (eventType === "CREATED") return "Creado";
  if (eventType === "RECEIVED") return "Datos actualizados";
  if (eventType === "PHOTO_UPLOADED") return "Foto subida";
  if (eventType === "STATUS_CHANGED") return "Cambio de estado";
  if (eventType === "SLOT_ASSIGNED") return "Slot asignado";
  if (eventType === "MOVED") return "Movimiento";
  if (eventType === "EXITED") return "Salida";
  return eventType;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function VehicleTimeline({ events }: Props) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Historial del vehículo</h3>

      {events.length === 0 ? (
        <p style={styles.empty}>Este vehículo aún no tiene eventos registrados.</p>
      ) : (
        <div style={styles.timeline}>
          {events.map((event) => (
            <div key={event.id} style={styles.item}>
              <div style={styles.marker}></div>

              <div style={styles.content}>
                <div style={styles.header}>
                  <span style={styles.badge}>{getEventLabel(event.event_type)}</span>
                  <span style={styles.date}>{formatDate(event.created_at)}</span>
                </div>

                <p style={styles.description}>{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  title: {
    marginTop: 0,
    marginBottom: "16px",
  },
  empty: {
    color: "#6b7280",
    margin: 0,
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  item: {
    display: "grid",
    gridTemplateColumns: "20px 1fr",
    gap: "12px",
    alignItems: "start",
  },
  marker: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    background: "#111827",
    marginTop: "6px",
  },
  content: {
    paddingBottom: "14px",
    borderBottom: "1px solid #f0f0f0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "6px",
  },
  badge: {
    background: "#f3f4f6",
    color: "#111827",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  date: {
    fontSize: "12px",
    color: "#6b7280",
  },
  description: {
    margin: 0,
    color: "#374151",
    fontSize: "14px",
  },
};