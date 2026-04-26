import { useState } from "react";
import { api } from "../api/client";
import ReceptionSearch from "../components/ReceptionSearch";
import ReceptionForm from "../components/ReceptionForm";
import VinScanner from "../components/VinScanner";
import VehicleTimeline from "../components/VehicleTimeLine";
import type { Vehicle } from "../types/vehicle";
import type { ReceptionFormData } from "../types/reception";
import type { VehicleEvent } from "../types/vehicleEvent";

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

export default function ReceptionPage() {
  const [searchValue, setSearchValue] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [formData, setFormData] = useState<ReceptionFormData>({
    vin: "",
    bl: "",
    color: "",
    brand: "",
    model: "",
    vehicle_year: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const fetchVehicleEvents = async (vehicleId: number) => {
    try {
      const response = await api.get<VehicleEvent[]>(`/vehicles/${vehicleId}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error("Error cargando historial", error);
      setEvents([]);
    }
  };

  const focusSearchInput = () => {
    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="Ingresa o escanea VIN"]'
      ) as HTMLInputElement | null;

      input?.focus();
      input?.select();
    }, 0);
  };

  const reloadVehicle = async (vehicleId: number) => {
    const updated = await api.get<Vehicle>(`/vehicles/${vehicleId}`);
    setVehicle(updated.data);
    setFormData(mapVehicleToForm(updated.data));
    setSearchValue(updated.data.vin);
    await fetchVehicleEvents(updated.data.id);
  };

  const searchVehicle = async (vinValue: string) => {
    if (!vinValue.trim()) {
      alert("Ingresa un VIN");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get<Vehicle[]>("/vehicles/", {
        params: { vin: vinValue.trim() },
      });

      if (response.data.length === 0) {
        alert("No se encontró ningún vehículo");
        setVehicle(null);
        setEvents([]);
        return;
      }

      const foundVehicle = response.data[0];
      setVehicle(foundVehicle);
      setFormData(mapVehicleToForm(foundVehicle));
      setSearchValue(foundVehicle.vin);
      await fetchVehicleEvents(foundVehicle.id);
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
    const isSecure =
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      alert(
        "La cámara en vivo requiere una conexión segura (HTTPS). Por ahora usa ingreso manual del VIN."
      );
      return;
    }

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
        vehicle_year: formData.vehicle_year ? Number(formData.vehicle_year) : null,
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
        vehicle_year: formData.vehicle_year ? Number(formData.vehicle_year) : null,
        notes: formData.notes || null,
      });

      await api.patch(`/vehicles/${vehicle.id}/status`, {
        status: newStatus,
      });

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

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Recepción</h1>
      <p style={styles.subtitle}>
        Escanea o ingresa el VIN, valida los datos y selecciona el flujo operativo.
      </p>

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

      {vehicle ? (
        <div style={styles.infoCard}>
          <p><strong>ID:</strong> {vehicle.id}</p>
          <p><strong>Estado actual:</strong> {vehicle.status}</p>
          <p><strong>Porteador:</strong> {vehicle.carrier_name ?? "-"}</p>
          <p><strong>Sector:</strong> {vehicle.sector_name ?? "-"}</p>
          <p><strong>Código de barra:</strong> {vehicle.vin}</p>
          <p><strong>BL:</strong> {vehicle.shipment_bl ?? "-"}</p>
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
      ) : null}

      {vehicle ? <VehicleTimeline events={events} /> : null}
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
  infoCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
};