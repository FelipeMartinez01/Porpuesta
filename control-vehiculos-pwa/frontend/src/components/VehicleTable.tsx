import type { Vehicle } from "../types/vehicle";

type Props = {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: number) => void;
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

export default function VehicleTable({
  vehicles,
  onSelectVehicle,
  onEditVehicle,
  onDeleteVehicle,
}: Props) {
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
                        onClick={() => {
                          if (confirm("¿Eliminar este vehículo?")) {
                            onDeleteVehicle(vehicle.id);
                          }
                        }}
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
    background: "#fff",
  },
  th: {
    borderBottom: "1px solid #e5e5e5",
    padding: "14px 12px",
    textAlign: "left",
    background: "#f9fafb",
    fontSize: "13px",
  },
  td: {
    borderBottom: "1px solid #f0f0f0",
    padding: "12px",
    verticalAlign: "top",
    fontSize: "14px",
  },
  emptyCell: {
    padding: "24px",
    textAlign: "center",
    color: "#666",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  viewButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  editButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  deleteButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
};