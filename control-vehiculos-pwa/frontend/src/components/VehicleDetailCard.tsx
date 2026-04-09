import type { Vehicle } from "../types/vehicle";

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

  if (status === "EN_TRANSITO") {
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

export default function VehicleDetailCard({ vehicle }: Props) {
  if (!vehicle) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Detalle del vehículo</h3>
        <p style={styles.emptyText}>Selecciona un vehículo para ver su detalle.</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Detalle del vehículo</h3>

      <DetailRow label="ID" value={vehicle.id} />
      <DetailRow label="VIN" value={vehicle.vin} />
      <DetailRow label="Código de barras" value={vehicle.barcode_id ?? "-"} />
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
};