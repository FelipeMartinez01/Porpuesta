export default function DashboardPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>
        Bienvenido al sistema de control y chequeo de vehículos.
      </p>

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Vehículos</h3>
          <p>Consulta, filtra y actualiza el estado de los vehículos.</p>
        </div>

        <div style={styles.card}>
          <h3>Carga masiva</h3>
          <p>Sube archivos Excel o CSV con los VIN de los vehículos.</p>
        </div>

        <div style={styles.card}>
          <h3>Recepción</h3>
          <p>Escaneo, formulario y transición de estados.</p>
        </div>

        <div style={styles.card}>
          <h3>Mapa de posiciones</h3>
          <p>Asignación visual de espacios tipo asientos de cine.</p>
        </div>
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
    fontSize: "32px",
  },
  subtitle: {
    margin: 0,
    marginBottom: "24px",
    color: "#6b7280",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
};