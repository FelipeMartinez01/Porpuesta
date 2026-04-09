export default function ReceptionPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Recepción</h1>
      <p style={styles.subtitle}>
        Aquí irá la pantalla de escaneo y formulario de recepción del vehículo.
      </p>

      <div style={styles.card}>
        <p>Próximo paso: abrir cámara / escáner y mostrar formulario editable.</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
  },
  title: {
    margin: 0,
    marginBottom: "8px",
  },
  subtitle: {
    marginBottom: "20px",
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  },
};