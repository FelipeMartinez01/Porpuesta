import type { Vehicle } from "../types/vehicle";

type Props = {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: number) => void;
};

function getStatusStyle(status: string): React.CSSProperties {
  if (status === "FALTANTE") {
    return { background: "#fee2e2", color: "#991b1b", ...baseStyle };
  }

  if (status === "DIRECTO") {
    return { background: "#dbeafe", color: "#1e40af", ...baseStyle };
  }

  if (status === "ALMACENADO") {
    return { background: "#fef3c7", color: "#92400e", ...baseStyle };
  }

  if (status === "EN_TRANSITO") {
    return { background: "#ede9fe", color: "#5b21b6", ...baseStyle };
  }

  if (status === "DESPACHADO") {
    return { background: "#dcfce7", color: "#166534", ...baseStyle };
  }

  return { background: "#f3f4f6", color: "#374151", ...baseStyle };
}

const baseStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: 700,
  fontSize: "12px",
  display: "inline-block",
};

export default function VehicleTable({
  vehicles,
  onSelectVehicle,
  onEditVehicle,
  onDeleteVehicle,
}: Props) {
  const handleDelete = (id: number) => {
    if (confirm("¿Seguro que quieres eliminar este vehículo?")) {
      onDeleteVehicle(id);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>VIN</th>
              <th style={styles.th}>Color</th>
              <th style={styles.th}>Marca</th>
              <th style={styles.th}>Modelo</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Porteador</th>
              <th style={styles.th}>Sector</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td style={styles.emptyCell} colSpan={9}>
                  No hay vehículos para mostrar.
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td style={styles.td}>{vehicle.id}</td>
                  <td style={styles.td}>{vehicle.vin}</td>
                  <td style={styles.td}>{vehicle.color ?? "-"}</td>
                  <td style={styles.td}>{vehicle.brand ?? "-"}</td>
                  <td style={styles.td}>{vehicle.model ?? "-"}</td>

                  <td style={styles.td}>
                    <span style={getStatusStyle(vehicle.status)}>
                      {vehicle.status}
                    </span>
                  </td>

                  <td style={styles.td}>{vehicle.carrier_name ?? "-"}</td>
                  <td style={styles.td}>{vehicle.sector_name ?? "-"}</td>

                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.viewButton}
                        onClick={() => onSelectVehicle(vehicle)}
                      >
                        Ver
                      </button>

                      <button
                        style={styles.editButton}
                        onClick={() => onEditVehicle(vehicle)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    borderBottom: "1px solid #e5e5e5",
    padding: "14px 12px",
    background: "#f9fafb",
    fontSize: "13px",
    textAlign: "left",
  },
  td: {
    borderBottom: "1px solid #f0f0f0",
    padding: "12px",
    fontSize: "14px",
  },
  emptyCell: {
    padding: "24px",
    textAlign: "center",
    color: "#666",
  },
  actions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  viewButton: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
  },
  editButton: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #93c5fd",
    background: "#eff6ff",
    color: "#1e40af",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    cursor: "pointer",
  },
};