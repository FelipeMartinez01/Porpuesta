import type { Vehicle } from "../types/vehicle";

type Props = {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onChangeStatus: (vehicleId: number, status: string) => void;
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

export default function VehicleTable({
  vehicles,
  onSelectVehicle,
  onChangeStatus,
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
                      <button style={styles.infoButton} onClick={() => onSelectVehicle(vehicle)}>
                        Ver
                      </button>
                      <button
                        style={styles.faltanteButton}
                        onClick={() => onChangeStatus(vehicle.id, "FALTANTE")}
                      >
                        Faltante
                      </button>
                      <button
                        style={styles.transitoButton}
                        onClick={() => onChangeStatus(vehicle.id, "EN_TRANSITO")}
                      >
                        Tránsito
                      </button>
                      <button
                        style={styles.okButton}
                        onClick={() => onChangeStatus(vehicle.id, "RECEPCIONADO")}
                      >
                        Recepcionado
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
  infoButton: {
    border: "1px solid #d1d5db",
    background: "#fff",
  },
  faltanteButton: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
  },
  transitoButton: {
    border: "1px solid #fde68a",
    background: "#fffbeb",
    color: "#92400e",
  },
  okButton: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
  },
};