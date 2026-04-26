import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import VehicleTimeline from "../components/VehicleTimeLine";
import type { Vehicle } from "../types/vehicle";
import type { VehicleEvent } from "../types/vehicleEvent";

export default function VehicleHistoryPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!vehicleId) return;

    try {
      setLoading(true);

      const [vehicleResponse, eventsResponse] = await Promise.all([
        api.get<Vehicle>(`/vehicles/${vehicleId}`),
        api.get<VehicleEvent[]>(`/vehicles/${vehicleId}/events`),
      ]);

      setVehicle(vehicleResponse.data);
      setEvents(eventsResponse.data);
    } catch (error) {
      console.error("Error cargando historial", error);
      alert("No se pudo cargar el historial del vehículo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [vehicleId]);

  return (
    <div style={styles.page}>
      <button style={styles.backButton} onClick={() => navigate("/vehicles")}>
        ← Volver a vehículos
      </button>

      <h1 style={styles.title}>Historial del vehículo</h1>

      {vehicle ? (
        <div style={styles.card}>
          <p><strong>ID:</strong> {vehicle.id}</p>
          <p><strong>VIN:</strong> {vehicle.vin}</p>
          <p><strong>Estado:</strong> {vehicle.status}</p>
          <p><strong>Porteador:</strong> {vehicle.carrier_name ?? "-"}</p>
          <p><strong>Sector:</strong> {vehicle.sector_name ?? "-"}</p>
        </div>
      ) : null}

      {loading ? <p>Cargando historial...</p> : null}

      <VehicleTimeline events={events} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    marginTop: "16px",
    marginBottom: "20px",
    fontSize: "32px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  backButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};