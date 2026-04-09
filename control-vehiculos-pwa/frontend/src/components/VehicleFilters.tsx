import type { Carrier, Sector } from "../types/catalogs";

type Props = {
  vin: string;
  status: string;
  carrierId: string;
  sectorId: string;
  carriers: Carrier[];
  sectors: Sector[];
  onVinChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCarrierChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

export default function VehicleFilters({
  vin,
  status,
  carrierId,
  sectorId,
  carriers,
  sectors,
  onVinChange,
  onStatusChange,
  onCarrierChange,
  onSectorChange,
  onSearch,
  onClear,
}: Props) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.field}>
        <label style={styles.label}>VIN</label>
        <input
          style={styles.input}
          type="text"
          placeholder="Buscar por VIN"
          value={vin}
          onChange={(e) => onVinChange(e.target.value)}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Estado</label>
        <select
          style={styles.input}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="FALTANTE">FALTANTE</option>
          <option value="EN_TRANSITO">EN_TRANSITO</option>
          <option value="RECEPCIONADO">RECEPCIONADO</option>
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Porteador</label>
        <select
          style={styles.input}
          value={carrierId}
          onChange={(e) => onCarrierChange(e.target.value)}
        >
          <option value="">Todos</option>
          {carriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Sector</label>
        <select
          style={styles.input}
          value={sectorId}
          onChange={(e) => onSectorChange(e.target.value)}
        >
          <option value="">Todos</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.actions}>
        <button style={styles.primaryButton} onClick={onSearch}>
          Buscar
        </button>

        <button style={styles.secondaryButton} onClick={onClear}>
          Limpiar
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
    padding: "18px",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e5e5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
  },
  input: {
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #d0d0d0",
    fontSize: "14px",
    background: "#fff",
  },
  actions: {
    display: "flex",
    gap: "10px",
    alignItems: "end",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "11px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "11px 16px",
    borderRadius: "10px",
    border: "1px solid #d0d0d0",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
};