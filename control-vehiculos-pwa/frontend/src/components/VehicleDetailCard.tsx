import type { Vehicle } from "../types/vehicle";
import { getImageUrl } from "../utils/url";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

type Props = {
  vehicle: Vehicle | null;
};

function getStatusStyle(status: string): React.CSSProperties {
  if (status === "FALTANTE") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "12px",
      display: "inline-block",
    };
  }

  if (status === "DIRECTO") {
    return {
      background: "#dbeafe",
      color: "#1e40af",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "12px",
      display: "inline-block",
    };
  }

  if (status === "ALMACENADO") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "12px",
      display: "inline-block",
    };
  }

  if (status === "EN_TRANSITO") {
    return {
      background: "#ede9fe",
      color: "#5b21b6",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "12px",
      display: "inline-block",
    };
  }

  if (status === "DESPACHADO") {
    return {
      background: "#dcfce7",
      color: "#166534",
      padding: "6px 10px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "12px",
      display: "inline-block",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#374151",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
    display: "inline-block",
  };
}

function getNextStates(status: string): string[] {
  switch (status) {
    case "FALTANTE":
      return ["DIRECTO", "ALMACENADO"];
    case "DIRECTO":
      return ["DESPACHADO"];
    case "ALMACENADO":
      return ["EN_TRANSITO"];
    case "EN_TRANSITO":
      return ["DESPACHADO"];
    default:
      return [];
  }
}

function getButtonLabel(status: string): string {
  if (status === "DIRECTO") return "Marcar directo";
  if (status === "ALMACENADO") return "Marcar almacenado";
  if (status === "EN_TRANSITO") return "Marcar en tránsito";
  if (status === "DESPACHADO") return "Despachar";
  return status;
}

function getButtonStyle(status: string): React.CSSProperties {
  if (status === "DIRECTO") {
    return { ...styles.statusButton, background: "#2563eb" };
  }

  if (status === "ALMACENADO") {
    return { ...styles.statusButton, background: "#d97706" };
  }

  if (status === "EN_TRANSITO") {
    return { ...styles.statusButton, background: "#7c3aed" };
  }

  if (status === "DESPACHADO") {
    return { ...styles.statusButton, background: "#16a34a" };
  }

  return styles.statusButton;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

export default function VehicleDetailCard({ vehicle }: Props) {
  const navigate = useNavigate();

  if (!vehicle) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Detalle del vehículo</h3>
        <p style={styles.emptyText}>Selecciona un vehículo para ver su detalle.</p>
      </div>
    );
  }

  const updateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/vehicles/${vehicle.id}/status`, {
        status: newStatus,
      });

      alert(`Estado actualizado a ${newStatus}`);
      window.location.reload();
    } catch (error) {
      console.error("Error cambiando estado", error);
      alert("No se pudo cambiar el estado. Revisa si la transición es válida.");
    }
  };

  const nextStates = getNextStates(vehicle.status);

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Detalle del vehículo</h3>

      {vehicle.photo_url ? (
        <div style={styles.photoBox}>
          <img
            src={getImageUrl(vehicle.photo_url)}
            alt={`Vehículo ${vehicle.vin}`}
            style={styles.photo}
          />
        </div>
      ) : (
        <div style={styles.noPhoto}>Sin foto principal</div>
      )}

      <DetailRow label="ID" value={vehicle.id} />
      <DetailRow label="VIN" value={vehicle.vin} />
      <DetailRow label="Código de barras" value={vehicle.barcode_id ?? "-"} />
      <DetailRow label="BL" value={vehicle.shipment_bl ?? "-"} />
      <DetailRow label="Color" value={vehicle.color ?? "-"} />
      <DetailRow label="Marca" value={vehicle.brand ?? "-"} />
      <DetailRow label="Modelo" value={vehicle.model ?? "-"} />
      <DetailRow label="Año" value={vehicle.vehicle_year ?? "-"} />
      <DetailRow
        label="Estado"
        value={<span style={getStatusStyle(vehicle.status)}>{vehicle.status}</span>}
      />
      <DetailRow label="Porteador" value={vehicle.carrier_name ?? "-"} />
      <DetailRow label="Sector" value={vehicle.sector_name ?? "-"} />
      <DetailRow label="Slot" value={vehicle.slot_id ?? "-"} />
      <DetailRow label="Notas" value={vehicle.notes ?? "-"} />

      {nextStates.length > 0 ? (
        <div style={styles.statusActions}>
          <p style={styles.actionsTitle}>Siguiente acción</p>

          {nextStates.map((next) => (
            <button
              key={next}
              style={getButtonStyle(next)}
              onClick={() => updateStatus(next)}
            >
              {getButtonLabel(next)}
            </button>
          ))}
        </div>
      ) : (
        <div style={styles.finalState}>Vehículo despachado / flujo finalizado</div>
      )}

      <button
        style={styles.historyButton}
        onClick={() => navigate(`/vehicles/${vehicle.id}/history`)}
      >
        Ver historial
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    position: "sticky",
    top: "20px",
  },
  title: {
    marginTop: 0,
    marginBottom: "16px",
  },
  photoBox: {
    marginBottom: "16px",
  },
  photo: {
    width: "100%",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    objectFit: "cover",
    maxHeight: "260px",
  },
  noPhoto: {
    marginBottom: "16px",
    padding: "16px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280",
    textAlign: "center",
  },
  emptyText: {
    color: "#666",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "10px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  label: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  value: {
    fontSize: "14px",
    color: "#111827",
    wordBreak: "break-word",
  },
  statusActions: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  actionsTitle: {
    margin: 0,
    marginBottom: "4px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#374151",
  },
  statusButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    width: "100%",
  },
  finalState: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 700,
    textAlign: "center",
  },
  historyButton: {
    marginTop: "16px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    width: "100%",
  },
};