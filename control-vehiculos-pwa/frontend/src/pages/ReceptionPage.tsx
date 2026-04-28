import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ReceptionSearch from "../components/ReceptionSearch";
import ReceptionForm from "../components/ReceptionForm";
import VinScanner from "../components/VinScanner";
import VehicleTimeline from "../components/VehicleTimeLine";
import type { Vehicle } from "../types/vehicle";
import type { ReceptionFormData } from "../types/reception";
import type { VehicleEvent } from "../types/vehicleEvent";

type ReceptionFilter = "FALTANTE" | "DIRECTO" | "ALMACENADO" | "EN_TRANSITO";

function mapVehicleToForm(vehicle: Vehicle): ReceptionFormData {
  return {
    vin: vehicle.vin ?? "",
    bl: vehicle.shipment_bl ?? "",
    color: vehicle.color ?? "",
    brand: vehicle.brand ?? "",
    model: vehicle.model ?? "",
    vehicle_year: vehicle.vehicle_year ? String(vehicle.vehicle_year) : "",
    notes: vehicle.notes ?? "",
  };
}

function getLocationText(vehicle: Vehicle) {
  if (vehicle.location_label) return vehicle.location_label;

  if (vehicle.sector_name && vehicle.slot_code) {
    return `${vehicle.sector_name} - ${vehicle.slot_code}`;
  }

  if (vehicle.slot_code) return vehicle.slot_code;

  return "-";
}

export default function ReceptionPage() {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState<ReceptionFilter>("FALTANTE");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ReceptionFormData>({
    vin: "",
    bl: "",
    color: "",
    brand: "",
    model: "",
    vehicle_year: "",
    notes: "",
  });

  const fetchVehicleEvents = async (vehicleId: number) => {
    try {
      const response = await api.get<VehicleEvent[]>(
        `/vehicles/${vehicleId}/events`
      );
      setEvents(response.data);
    } catch (error) {
      console.error("Error cargando historial", error);
      setEvents([]);
    }
  };

  const fetchVehiclesByFilter = async (
    currentFilter: ReceptionFilter,
    vinValue = ""
  ) => {
    try {
      setLoading(true);

      const params: Record<string, string> = {
        status: currentFilter,
      };

      if (vinValue.trim()) {
        params.vin = vinValue.trim();
      }

      const response = await api.get<Vehicle[]>("/vehicles/", { params });
      setVehicles(response.data);
    } catch (error) {
      console.error("Error cargando vehículos filtrados", error);
      alert("No se pudieron cargar los vehículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesByFilter(filter, searchValue);
  }, [filter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVehiclesByFilter(filter, searchValue);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  const focusSearchInput = () => {
    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="Ingresa o escanea VIN"]'
      ) as HTMLInputElement | null;

      input?.focus();
      input?.select();
    }, 0);
  };

  const resetSelection = (newFilter: ReceptionFilter) => {
    setFilter(newFilter);
    setVehicle(null);
    setEvents([]);
    setSearchValue("");
  };

  const selectVehicle = async (selected: Vehicle) => {
    setVehicle(selected);
    setFormData(mapVehicleToForm(selected));
    setSearchValue(selected.vin);
    await fetchVehicleEvents(selected.id);
    focusSearchInput();
  };

  const reloadVehicle = async (vehicleId: number) => {
    const updated = await api.get<Vehicle>(`/vehicles/${vehicleId}`);

    setVehicle(updated.data);
    setFormData(mapVehicleToForm(updated.data));
    setSearchValue(updated.data.vin);

    await fetchVehicleEvents(updated.data.id);
    await fetchVehiclesByFilter(filter, updated.data.vin);
  };

  const searchVehicle = async (vinValue: string) => {
    if (!vinValue.trim()) {
      alert("Ingresa un VIN");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get<Vehicle[]>("/vehicles/", {
        params: {
          vin: vinValue.trim(),
          status: filter,
        },
      });

      if (response.data.length === 0) {
        alert("No se encontró ningún vehículo con ese filtro");
        setVehicle(null);
        setEvents([]);
        return;
      }

      await selectVehicle(response.data[0]);
    } catch (error) {
      console.error("Error buscando vehículo", error);
      alert("No se pudo buscar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await searchVehicle(searchValue);
    focusSearchInput();
  };

  const handleDetected = async (decodedText: string) => {
    setScannerOpen(false);
    setSearchValue(decodedText);
    await searchVehicle(decodedText);
    focusSearchInput();
  };

  const handleOpenScanner = () => {
    setScannerOpen(true);
  };

  const handleChange = (field: keyof ReceptionFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!vehicle) {
      alert("Primero debes buscar un vehículo");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/vehicles/${vehicle.id}`, {
        vin: formData.vin,
        color: formData.color || null,
        brand: formData.brand || null,
        model: formData.model || null,
        vehicle_year: formData.vehicle_year
          ? Number(formData.vehicle_year)
          : null,
        notes: formData.notes || null,
      });

      await reloadVehicle(vehicle.id);
      alert("Vehículo actualizado correctamente");
      focusSearchInput();
    } catch (error) {
      console.error("Error guardando vehículo", error);
      alert("No se pudo guardar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!vehicle) {
      alert("Primero debes buscar un vehículo");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/vehicles/${vehicle.id}`, {
        vin: formData.vin,
        color: formData.color || null,
        brand: formData.brand || null,
        model: formData.model || null,
        vehicle_year: formData.vehicle_year
          ? Number(formData.vehicle_year)
          : null,
        notes: formData.notes || null,
      });

      await api.patch(`/vehicles/${vehicle.id}/status`, {
        status: newStatus,
      });

      if (newStatus === "ALMACENADO") {
        alert("Vehículo marcado como ALMACENADO. Ahora debes asignarle una ubicación en el mapa.");

        navigate("/parking-map", {
          state: {
            searchVin: vehicle.vin,
          },
        });

        return;
      }

      await reloadVehicle(vehicle.id);
      alert(`Vehículo actualizado a ${newStatus}`);
      focusSearchInput();
    } catch (error) {
      console.error("Error cambiando estado", error);
      alert("No se pudo actualizar el estado. Revisa si el flujo es válido.");
    } finally {
      setLoading(false);
    }
  };

  const getFilterTitle = () => {
    if (filter === "FALTANTE") return "Pendientes de recepción";
    if (filter === "DIRECTO") return "Vehículos directos";
    if (filter === "ALMACENADO") return "Vehículos almacenados";
    return "Vehículos en tránsito";
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Recepción</h1>

      <p style={styles.subtitle}>
        Filtra, escanea o busca vehículos por VIN y selecciona el flujo
        operativo.
      </p>

      <div style={styles.filterCard}>
        <button
          style={{
            ...styles.filterButton,
            ...(filter === "FALTANTE" ? styles.activeFilter : {}),
          }}
          onClick={() => resetSelection("FALTANTE")}
        >
          Pendientes
        </button>

        <button
          style={{
            ...styles.filterButton,
            ...(filter === "DIRECTO" ? styles.activeFilter : {}),
          }}
          onClick={() => resetSelection("DIRECTO")}
        >
          Directos
        </button>

        <button
          style={{
            ...styles.filterButton,
            ...(filter === "ALMACENADO" ? styles.activeFilter : {}),
          }}
          onClick={() => resetSelection("ALMACENADO")}
        >
          Almacenados
        </button>

        <button
          style={{
            ...styles.filterButton,
            ...(filter === "EN_TRANSITO" ? styles.activeFilter : {}),
          }}
          onClick={() => resetSelection("EN_TRANSITO")}
        >
          En tránsito
        </button>
      </div>

      <ReceptionSearch
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        onSearch={handleSearch}
        onOpenScanner={handleOpenScanner}
      />

      {scannerOpen ? (
        <VinScanner
          onDetected={handleDetected}
          onClose={() => {
            setScannerOpen(false);
            focusSearchInput();
          }}
        />
      ) : null}

      <div style={styles.layout}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>{getFilterTitle()}</h2>

          {loading ? <p style={styles.loading}>Cargando...</p> : null}

          {vehicles.length === 0 ? (
            <div style={styles.empty}>No hay vehículos para este filtro.</div>
          ) : (
            <div style={styles.vehicleList}>
              {vehicles.map((item) => (
                <button
                  key={item.id}
                  style={{
                    ...styles.vehicleItem,
                    ...(vehicle?.id === item.id
                      ? styles.vehicleItemActive
                      : {}),
                  }}
                  onClick={() => selectVehicle(item)}
                >
                  <strong>{item.vin}</strong>

                  <span>
                    {item.brand ?? "-"} {item.model ?? ""}
                  </span>

                  <small>
                    Estado: {item.status} · BL: {item.shipment_bl ?? "-"} ·
                    Nave: {item.vessel_name ?? "-"} · Viaje:{" "}
                    {item.voyage_number ?? "-"} · Ubicación:{" "}
                    {getLocationText(item)}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {vehicle ? (
            <div style={styles.infoCard}>
              <p>
                <strong>ID:</strong> {vehicle.id}
              </p>
              <p>
                <strong>VIN:</strong> {vehicle.vin}
              </p>
              <p>
                <strong>Estado actual:</strong> {vehicle.status}
              </p>
              <p>
                <strong>BL:</strong> {vehicle.shipment_bl ?? "-"}
              </p>
              <p>
                <strong>Nave:</strong> {vehicle.vessel_name ?? "-"}
              </p>
              <p>
                <strong>Viaje:</strong> {vehicle.voyage_number ?? "-"}
              </p>
              <p>
                <strong>Porteador:</strong> {vehicle.carrier_name ?? "-"}
              </p>
              <p>
                <strong>Ubicación:</strong> {getLocationText(vehicle)}
              </p>
              <p>
                <strong>Código de barra:</strong> {vehicle.vin}
              </p>
            </div>
          ) : null}

          {vehicle ? (
            <ReceptionForm
              formData={formData}
              status={vehicle.status}
              onChange={handleChange}
              onSave={handleSave}
              onMarkDirect={() => handleChangeStatus("DIRECTO")}
              onMarkStored={() => handleChangeStatus("ALMACENADO")}
              onMarkTransit={() => handleChangeStatus("EN_TRANSITO")}
              onDispatch={() => handleChangeStatus("DESPACHADO")}
              loading={loading}
            />
          ) : (
            <div style={styles.infoCard}>
              <p style={styles.emptyText}>
                Selecciona un vehículo para ver y actualizar sus datos.
              </p>
            </div>
          )}

          {vehicle ? <VehicleTimeline events={events} /> : null}
        </div>
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
  filterCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "16px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterButton: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  activeFilter: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
    alignItems: "start",
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
  },
  loading: {
    color: "#6b7280",
  },
  empty: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280",
    textAlign: "center",
  },
  emptyText: {
    color: "#6b7280",
    margin: 0,
  },
  vehicleList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "520px",
    overflowY: "auto",
  },
  vehicleItem: {
    textAlign: "left",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  vehicleItemActive: {
    border: "2px solid #111827",
    background: "#f9fafb",
  },
  infoCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
};