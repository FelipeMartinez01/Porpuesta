import { useEffect, useState } from "react";
import { api } from "../api/client";
import ParkingGrid from "../components/ParkingGrid";
import type { ParkingSlot } from "../types/parking";
import type { Vehicle } from "../types/vehicle";

export default function ParkingMapPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [slotsResponse, vehiclesResponse] = await Promise.all([
        api.get<ParkingSlot[]>("/parking-slots/", {
          params: { sector_id: 1 },
        }),
        api.get<Vehicle[]>("/vehicles/", {
          params: { status: "EN_TRANSITO" },
        }),
      ]);

      setSlots(slotsResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (error) {
      console.error("Error cargando mapa", error);
      alert("No se pudieron cargar slots o vehículos en tránsito");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedVehicleId) {
      alert("Debes seleccionar un vehículo");
      return;
    }

    if (!selectedSlot) {
      alert("Debes seleccionar un slot");
      return;
    }

    try {
      setLoading(true);

      await api.patch(`/vehicles/${selectedVehicleId}/assign-slot`, {
        slot_id: selectedSlot.id,
      });

      alert("Ubicación asignada correctamente. Vehículo recepcionado.");

      setSelectedVehicleId("");
      setSelectedSlot(null);
      await fetchData();
    } catch (error) {
      console.error("Error asignando slot", error);
      alert("No se pudo asignar la ubicación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mapa de Posiciones</h1>
      <p style={styles.subtitle}>
        Selecciona un vehículo en tránsito y asígnale una ubicación física en el patio.
      </p>

      <div style={styles.card}>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Vehículo en tránsito</label>
            <select
              style={styles.input}
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <option value="">Selecciona un vehículo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vin} - {vehicle.brand ?? "-"} {vehicle.model ?? ""}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Slot seleccionado</label>
            <input
              style={styles.input}
              value={selectedSlot?.code ?? ""}
              placeholder="Selecciona un espacio en el mapa"
              readOnly
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={handleAssign} disabled={loading}>
            {loading ? "Asignando..." : "Asignar ubicación y recepcionar"}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <ParkingGrid
          slots={slots}
          selectedSlotId={selectedSlot?.id ?? null}
          onSelectSlot={setSelectedSlot}
        />
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
    marginTop: 0,
    marginBottom: "20px",
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  actions: {
    marginTop: "20px",
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
};