export default function ParkingMapPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mapa de Posiciones</h1>
      <p style={styles.subtitle}>
        Aquí irá la vista tipo asientos de cine para asignar ubicación al vehículo.
      </p>

      <div style={styles.card}>
        <p>Próximo paso: crear grilla visual con estados disponible, salida y ocupado.</p>
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