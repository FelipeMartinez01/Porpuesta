import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client";
import ParkingGrid from "../components/ParkingGrid";
import type { ParkingSlot, SlotVehicleInfo } from "../types/parking";
import type { Vehicle } from "../types/vehicle";
import type { Sector } from "../types/catalogs";

type SlotFilter = "TODOS" | "DISPONIBLE" | "OCUPADO" | "SALIDA";

export default function ParkingMapPage() {
  const location = useLocation();
  const initialSearchVin =
    (location.state as { searchVin?: string } | null)?.searchVin ?? "";

  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState(initialSearchVin);
  const [vehicleSuggestionsOpen, setVehicleSuggestionsOpen] = useState(false);

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState("1");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [selectedSlotVehicle, setSelectedSlotVehicle] =
    useState<SlotVehicleInfo | null>(null);

  const [slotVehicles, setSlotVehicles] = useState<
    Record<number, SlotVehicleInfo>
  >({});
  const [loading, setLoading] = useState(false);

  const [mapSearch, setMapSearch] = useState(initialSearchVin);
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("TODOS");
  const [highlightedSlotId, setHighlightedSlotId] = useState<number | null>(
    null
  );

  const fetchData = async (sectorId: string) => {
    try {
      const [slotsResponse, vehiclesResponse, sectorsResponse] =
        await Promise.all([
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
            const response = await api.get<SlotVehicleInfo>(
              `/vehicles/by-slot/${slot.id}`
            );
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

  useEffect(() => {
    if (!initialSearchVin.trim()) return;
    if (vehicles.length === 0) return;

    const foundVehicle = vehicles.find(
      (item) =>
        item.vin.toLowerCase() === initialSearchVin.trim().toLowerCase()
    );

    if (!foundVehicle) return;

    setSelectedVehicle(foundVehicle);
    setSelectedVehicleId(String(foundVehicle.id));
    setVehicleSearch(foundVehicle.vin);
    setVehicleSuggestionsOpen(false);
  }, [vehicles, initialSearchVin]);

  useEffect(() => {
    if (!mapSearch.trim()) return;
    if (Object.keys(slotVehicles).length === 0) return;

    const timeout = setTimeout(() => {
      handleSearchInMap(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [slotVehicles]);

  const filteredVehicleSuggestions = useMemo(() => {
    const search = vehicleSearch.trim().toLowerCase();

    if (search.length < 3) return [];

    return vehicles
      .filter((vehicle) => {
        const vin = vehicle.vin.toLowerCase();
        const brand = (vehicle.brand ?? "").toLowerCase();
        const model = (vehicle.model ?? "").toLowerCase();
        const bl = (vehicle.shipment_bl ?? "").toLowerCase();

        return (
          vin.includes(search) ||
          brand.includes(search) ||
          model.includes(search) ||
          bl.includes(search)
        );
      })
      .slice(0, 10);
  }, [vehicles, vehicleSearch]);

  const stats = useMemo(() => {
    const total = slots.length;
    const disponibles = slots.filter(
      (slot) => slot.visual_status === "DISPONIBLE"
    ).length;
    const ocupados = slots.filter(
      (slot) => slot.visual_status === "OCUPADO"
    ).length;
    const salida = slots.filter(
      (slot) => slot.visual_status === "SALIDA"
    ).length;
    const ocupacion = total === 0 ? 0 : Math.round((ocupados / total) * 100);

    return {
      total,
      disponibles,
      ocupados,
      salida,
      ocupacion,
    };
  }, [slots]);

  const visibleSlots = useMemo(() => {
    if (slotFilter === "TODOS") return slots;
    return slots.filter((slot) => slot.visual_status === slotFilter);
  }, [slots, slotFilter]);

  const handleSelectStoredVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedVehicleId(String(vehicle.id));
    setVehicleSearch(vehicle.vin);
    setVehicleSuggestionsOpen(false);
  };

  const handleSearchInMap = (showAlert = true) => {
    if (!mapSearch.trim()) {
      setHighlightedSlotId(null);

      if (showAlert) {
        alert("Ingresa parte del VIN para buscar en el mapa");
      }

      return;
    }

    const search = mapSearch.trim().toLowerCase();

    const foundEntry = Object.entries(slotVehicles).find(([, vehicle]) =>
      vehicle.vin.toLowerCase().includes(search)
    );

    if (!foundEntry) {
      setHighlightedSlotId(null);
      setSelectedSlot(null);
      setSelectedSlotVehicle(null);

      if (showAlert) {
        alert("No se encontró ese VIN en el mapa");
      }

      return;
    }

    const slotId = Number(foundEntry[0]);
    const foundSlot = slots.find((slot) => slot.id === slotId) ?? null;
    const foundVehicle = foundEntry[1];

    setHighlightedSlotId(slotId);
    setSelectedSlot(foundSlot);
    setSelectedSlotVehicle(foundVehicle);
    setSlotFilter("TODOS");
  };

  const handleAssign = async () => {
    if (!selectedVehicleId) {
      alert("Debes seleccionar un vehículo");
      return;
    }

    if (!selectedSlot) {
      alert("Debes seleccionar una ubicación");
      return;
    }

    if (selectedSlot.visual_status === "OCUPADO") {
      alert("Esa ubicación ya está ocupada");
      return;
    }

    try {
      setLoading(true);

      await api.patch(`/vehicles/${selectedVehicleId}/assign-slot`, {
        slot_id: selectedSlot.id,
      });

      alert("Ubicación asignada correctamente.");

      setSelectedVehicleId("");
      setSelectedVehicle(null);
      setVehicleSearch("");
      setSelectedSlot(null);
      setSelectedSlotVehicle(null);
      setHighlightedSlotId(null);
      setMapSearch("");

      await fetchData(selectedSectorId);
    } catch (error) {
      console.error("Error asignando ubicación", error);
      alert("No se pudo asignar la ubicación");
    } finally {
      setLoading(false);
    }
  };

  const handleResetMap = async () => {
    const confirmReset = confirm(
      "¿Seguro que quieres limpiar todo el mapa? Esto dejará todos los espacios disponibles y quitará la ubicación asignada a los vehículos."
    );

    if (!confirmReset) return;

    try {
      setLoading(true);

      await api.post("/parking-slots/reset");

      setSelectedVehicleId("");
      setSelectedVehicle(null);
      setVehicleSearch("");
      setSelectedSlot(null);
      setSelectedSlotVehicle(null);
      setSlotVehicles({});
      setHighlightedSlotId(null);
      setMapSearch("");

      await fetchData(selectedSectorId);

      alert("Mapa limpiado correctamente");
    } catch (error) {
      console.error("Error limpiando mapa", error);
      alert("No se pudo limpiar el mapa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = async (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setHighlightedSlotId(slot.id);

    if (slot.visual_status === "OCUPADO") {
      try {
        const response = await api.get<SlotVehicleInfo>(
          `/vehicles/by-slot/${slot.id}`
        );
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
        Control visual del patio, búsqueda de vehículos y asignación de
        ubicaciones.
      </p>

      {initialSearchVin ? (
        <div style={styles.arrivalNotice}>
          Vehículo enviado desde recepción: <strong>{initialSearchVin}</strong>.
          Selecciona una ubicación disponible en el mapa y presiona{" "}
          <strong>Asignar ubicación</strong>.
        </div>
      ) : null}

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span>Total ubicaciones</span>
          <strong>{stats.total}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span>Disponibles</span>
          <strong>{stats.disponibles}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span>Ocupadas</span>
          <strong>{stats.ocupados}</strong>
        </div>

        <div style={styles.kpiCard}>
          <span>Ocupación</span>
          <strong>{stats.ocupacion}%</strong>
        </div>
      </div>

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
                setHighlightedSlotId(null);
              }}
            >
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, position: "relative" }}>
            <label style={styles.label}>Vehículo almacenado</label>

            <input
              style={styles.input}
              value={vehicleSearch}
              onFocus={() => setVehicleSuggestionsOpen(true)}
              onChange={(e) => {
                setVehicleSearch(e.target.value);
                setSelectedVehicleId("");
                setSelectedVehicle(null);
                setVehicleSuggestionsOpen(true);
              }}
              placeholder="Buscar VIN, marca, modelo o BL"
              autoComplete="off"
            />

            {vehicleSuggestionsOpen && vehicleSearch.trim().length >= 3 ? (
              <div style={styles.suggestionBox}>
                {filteredVehicleSuggestions.length === 0 ? (
                  <div style={styles.suggestionEmpty}>
                    No hay vehículos almacenados disponibles.
                  </div>
                ) : (
                  filteredVehicleSuggestions.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      style={styles.suggestionItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectStoredVehicle(vehicle);
                      }}
                    >
                      <strong>{vehicle.vin}</strong>

                      <span>
                        {vehicle.brand ?? "-"} {vehicle.model ?? ""} · BL:{" "}
                        {vehicle.shipment_bl ?? "-"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {selectedVehicle ? (
              <div style={styles.selectedVehicleBox}>
                <strong>Seleccionado:</strong> {selectedVehicle.vin} ·{" "}
                {selectedVehicle.brand ?? "-"} {selectedVehicle.model ?? ""}
              </div>
            ) : null}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Ubicación seleccionada</label>

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

          <button
            style={styles.dangerButton}
            onClick={handleResetMap}
            disabled={loading}
          >
            Limpiar mapa
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Búsqueda inteligente en mapa</h3>

        <div style={styles.searchRow}>
          <input
            style={styles.input}
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            placeholder="Buscar VIN dentro del mapa"
          />

          <button style={styles.button} onClick={() => handleSearchInMap(true)}>
            Buscar VIN
          </button>
        </div>

        <div style={styles.filterRow}>
          {(["TODOS", "DISPONIBLE", "OCUPADO", "SALIDA"] as SlotFilter[]).map(
            (filter) => (
              <button
                key={filter}
                style={{
                  ...styles.filterButton,
                  ...(slotFilter === filter ? styles.activeFilterButton : {}),
                }}
                onClick={() => setSlotFilter(filter)}
              >
                {filter}
              </button>
            )
          )}
        </div>
      </div>

      {selectedSlot ? (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Detalle de ubicación</h3>

          <p>
            <strong>Ubicación:</strong> {selectedSlot.code}
          </p>

          <p>
            <strong>Estado visual:</strong> {selectedSlot.visual_status}
          </p>

          {selectedSlotVehicle ? (
            <>
              <p>
                <strong>VIN:</strong> {selectedSlotVehicle.vin}
              </p>

              <p>
                <strong>Estado vehículo:</strong> {selectedSlotVehicle.status}
              </p>

              <p>
                <strong>Porteador:</strong>{" "}
                {selectedSlotVehicle.carrier_name ?? "-"}
              </p>

              <p>
                <strong>Marca / Modelo:</strong>{" "}
                {selectedSlotVehicle.brand ?? "-"}{" "}
                {selectedSlotVehicle.model ?? ""}
              </p>
            </>
          ) : (
            <p>Esta ubicación no tiene vehículo asociado.</p>
          )}
        </div>
      ) : null}

      <div style={styles.card}>
        <ParkingGrid
          slots={visibleSlots}
          selectedSlotId={selectedSlot?.id ?? null}
          highlightedSlotId={highlightedSlotId}
          slotVehicles={slotVehicles}
          onSelectSlot={handleSelectSlot}
        />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
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
  arrivalNotice: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "20px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  kpiCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
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
  searchRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "12px",
    marginBottom: "14px",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterButton: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  activeFilterButton: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
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
  suggestionBox: {
    position: "absolute",
    top: "76px",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
    zIndex: 50,
    maxHeight: "260px",
    overflowY: "auto",
  },
  suggestionItem: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderBottom: "1px solid #f3f4f6",
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
  },
  suggestionEmpty: {
    padding: "14px",
    color: "#6b7280",
    fontSize: "13px",
  },
  selectedVehicleBox: {
    marginTop: "4px",
    padding: "10px",
    borderRadius: "10px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "13px",
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