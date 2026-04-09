import { useEffect, useState } from "react";
import { api } from "../api/client";
import VehicleFilters from "../components/VehicleFilters";
import VehicleTable from "../components/VehicleTable";
import VehicleDetailCard from "../components/VehicleDetailCard";
import type { Vehicle } from "../types/vehicle";
import type { Carrier, Sector } from "../types/catalogs";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);

  const [vin, setVin] = useState("");
  const [status, setStatus] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [sectorId, setSectorId] = useState("");

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const params: Record<string, string | number> = {};

      if (vin.trim()) params.vin = vin.trim();
      if (status) params.status = status;
      if (carrierId) params.carrier_id = Number(carrierId);
      if (sectorId) params.sector_id = Number(sectorId);

      const response = await api.get<Vehicle[]>("/vehicles/", { params });
      setVehicles(response.data);
    } catch (error) {
      console.error("Error cargando vehículos", error);
      alert("Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const [carriersResponse, sectorsResponse] = await Promise.all([
        api.get<Carrier[]>("/carriers/"),
        api.get<Sector[]>("/sectors/"),
      ]);

      setCarriers(carriersResponse.data);
      setSectors(sectorsResponse.data);
    } catch (error) {
      console.error("Error cargando catálogos", error);
      alert("No se pudieron cargar porteadores o sectores");
    }
  };

  const handleChangeStatus = async (vehicleId: number, newStatus: string) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/status`, {
        status: newStatus,
      });

      await fetchVehicles();

      if (selectedVehicle && selectedVehicle.id === vehicleId) {
        const updated = await api.get<Vehicle>(`/vehicles/${vehicleId}`);
        setSelectedVehicle(updated.data);
      }
    } catch (error) {
      console.error("Error cambiando estado", error);
      alert("No se pudo cambiar el estado");
    }
  };

  const handleSearch = async () => {
    await fetchVehicles();
  };

  const handleClear = async () => {
    setVin("");
    setStatus("");
    setCarrierId("");
    setSectorId("");

    try {
      setLoading(true);
      const response = await api.get<Vehicle[]>("/vehicles/");
      setVehicles(response.data);
    } catch (error) {
      console.error("Error limpiando filtros", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
    fetchVehicles();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Visualización de Vehículos</h1>
          <p style={styles.subtitle}>
            Consulta, filtra y actualiza el estado de los vehículos recepcionados.
          </p>
        </div>
      </div>

      <VehicleFilters
        vin={vin}
        status={status}
        carrierId={carrierId}
        sectorId={sectorId}
        carriers={carriers}
        sectors={sectors}
        onVinChange={setVin}
        onStatusChange={setStatus}
        onCarrierChange={setCarrierId}
        onSectorChange={setSectorId}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {loading ? <p style={styles.loading}>Cargando vehículos...</p> : null}

      <div style={styles.layout}>
        <div style={styles.tableArea}>
          <VehicleTable
            vehicles={vehicles}
            onSelectVehicle={setSelectedVehicle}
            onChangeStatus={handleChangeStatus}
          />
        </div>

        <div style={styles.detailArea}>
          <VehicleDetailCard vehicle={selectedVehicle} />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "20px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    marginBottom: "8px",
    fontSize: "32px",
  },
  subtitle: {
    margin: 0,
    color: "#6b7280",
  },
  loading: {
    marginBottom: "16px",
  },
  layout: {
  display: "grid",
  gridTemplateColumns: window.innerWidth < 980 ? "1fr" : "minmax(0, 2fr) minmax(300px, 1fr)",
  gap: "20px",
  alignItems: "start",
  },
  tableArea: {
    minWidth: 0,
  },
  detailArea: {
    minWidth: 0,
  },
};