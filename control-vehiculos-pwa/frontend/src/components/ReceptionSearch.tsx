type Props = {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearch: () => void;
  onOpenScanner: () => void;
};

export default function ReceptionSearch({
  searchValue,
  onSearchValueChange,
  onSearch,
  onOpenScanner,
}: Props) {
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Buscar vehículo</h2>
      <p style={styles.text}>
        Ingresa el VIN manualmente o usa la cámara para escanearlo.
      </p>

      <div style={styles.row}>
        <input
          style={styles.input}
          type="text"
          placeholder="Ingresa o escanea VIN"
          value={searchValue}
          onChange={(e) => onSearchValueChange(e.target.value)}
        />

        <button style={styles.secondaryButton} onClick={onOpenScanner}>
          Abrir cámara
        </button>

        <button style={styles.button} onClick={onSearch}>
          Buscar
        </button>
      </div>
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
    margin: 0,
    marginBottom: "8px",
  },
  text: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#6b7280",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  button: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};