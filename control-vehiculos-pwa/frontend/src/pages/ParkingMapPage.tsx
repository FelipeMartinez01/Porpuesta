import { useEffect, useState } from "react";
import { api } from "../api/client";
import ParkingGrid from "../components/ParkingGrid";
import type { ParkingSlot, SlotVehicleInfo } from "../types/parking";
import type { Vehicle } from "../types/vehicle";
import type { Sector } from "../types/catalogs";

export default function ParkingMapPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState("1");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [selectedSlotVehicle, setSelectedSlotVehicle] = useState<SlotVehicleInfo | null>(null);
  const [slotVehicles, setSlotVehicles] = useState<Record<number, SlotVehicleInfo>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = async (sectorId: string) => {
    try {
      const [slotsResponse, vehiclesResponse, sectorsResponse] = await Promise.all([
        api.get<ParkingSlot[]>("/parking-slots/", {
          params: { sector_id: Number(sectorId) },
        }),
        api.get<Vehicle[]>("/vehicles/", {
          params: { status: "ALMACENADO" },
        }),
        api.get<Sector[]>("/sectors/"),
      ]);

      setSlots(slotsResponse.data);
      setVehicles(vehiclesResponse.data);
      setSectors(sectorsResponse.data);

      const occupiedSlots = slotsResponse.data.filter(
        (slot) => slot.visual_status === "OCUPADO"
      );

      const slotVehicleEntries = await Promise.all(
        occupiedSlots.map(async (slot) => {
          try {
            const response = await api.get<SlotVehicleInfo>(`/vehicles/by-slot/${slot.id}`);
            return [slot.id, response.data] as const;
          } catch {
            return [slot.id, null] as const;
          }
        })
      );

      const slotVehicleMap: Record<number, SlotVehicleInfo> = {};

      slotVehicleEntries.forEach(([slotId, vehicle]) => {
        if (vehicle) {
          slotVehicleMap[slotId] = vehicle;
        }
      });

      setSlotVehicles(slotVehicleMap);
    } catch (error) {
      console.error("Error cargando mapa", error);
      alert("No se pudieron cargar slots o vehículos");
    }
  };

  useEffect(() => {
    fetchData(selectedSectorId);

    const interval = setInterval(() => {
      fetchData(selectedSectorId);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedSectorId]);

  const handleAssign = async () => {
    if (!selectedVehicleId) {
      alert("Debes seleccionar un vehículo");
      return;
    }

    if (!selectedSlot) {
      alert("Debes seleccionar un slot");
      return;
    }

    if (selectedSlot.visual_status === "OCUPADO") {
      alert("Ese slot ya está ocupado");
      return;
    }

    try {
      setLoading(true);

      await api.patch(`/vehicles/${selectedVehicleId}/assign-slot`, {
        slot_id: selectedSlot.id,
      });

      alert("Ubicación asignada correctamente.");

      setSelectedVehicleId("");
      setSelectedSlot(null);
      setSelectedSlotVehicle(null);
      await fetchData(selectedSectorId);
    } catch (error) {
      console.error("Error asignando slot", error);
      alert("No se pudo asignar la ubicación");
    } finally {
      setLoading(false);
    }
  };

  const handleResetMap = async () => {
    const confirmReset = confirm(
      "¿Seguro que quieres limpiar todo el mapa? Esto dejará todos los slots disponibles y quitará la ubicación asignada a los vehículos."
    );

    if (!confirmReset) return;

    try {
      setLoading(true);

      await api.post("/parking-slots/reset");

      setSelectedVehicleId("");
      setSelectedSlot(null);
      setSelectedSlotVehicle(null);
      setSlotVehicles({});

      await fetchData(selectedSectorId);

      alert("Mapa limpiado correctamente");
    } catch (error) {
      console.error("Error limpiando mapa", error);
      alert("No se pudo limpiar el mapa. Revisa que exista el endpoint /parking-slots/reset");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = async (slot: ParkingSlot) => {
    setSelectedSlot(slot);

    if (slot.visual_status === "OCUPADO") {
      try {
        const response = await api.get<SlotVehicleInfo>(`/vehicles/by-slot/${slot.id}`);
        setSelectedSlotVehicle(response.data);
      } catch {
        setSelectedSlotVehicle(null);
      }
    } else {
      setSelectedSlotVehicle(null);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Mapa de Posiciones</h1>
      <p style={styles.subtitle}>
        Selecciona un vehículo almacenado y asígnale una ubicación física en el patio.
      </p>

      <div style={styles.card}>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Sector</label>
            <select
              style={styles.input}
              value={selectedSectorId}
              onChange={(e) => {
                setSelectedSectorId(e.target.value);
                setSelectedSlot(null);
                setSelectedSlotVehicle(null);
              }}
            >
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Vehículo almacenado</label>
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
            {loading ? "Asignando..." : "Asignar ubicación"}
          </button>

          <button style={styles.dangerButton} onClick={handleResetMap} disabled={loading}>
            Limpiar mapa
          </button>
        </div>
      </div>

      {selectedSlot && selectedSlot.visual_status === "OCUPADO" ? (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Detalle del slot ocupado</h3>
          <p>
            <strong>Slot:</strong> {selectedSlot.code}
          </p>

          {selectedSlotVehicle ? (
            <>
              <p>
                <strong>VIN:</strong> {selectedSlotVehicle.vin}
              </p>
              <p>
                <strong>Estado:</strong> {selectedSlotVehicle.status}
              </p>
              <p>
                <strong>Porteador:</strong> {selectedSlotVehicle.carrier_name ?? "-"}
              </p>
              <p>
                <strong>Marca / Modelo:</strong> {selectedSlotVehicle.brand ?? "-"}{" "}
                {selectedSlotVehicle.model ?? ""}
              </p>
            </>
          ) : (
            <p>No se pudo cargar el detalle del vehículo.</p>
          )}
        </div>
      ) : null}

      <div style={styles.card}>
        <ParkingGrid
          slots={slots}
          selectedSlotId={selectedSlot?.id ?? null}
          slotVehicles={slotVehicles}
          onSelectSlot={handleSelectSlot}
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
  sectionTitle: {
    marginTop: 0,
    marginBottom: "12px",
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
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
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
  dangerButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};