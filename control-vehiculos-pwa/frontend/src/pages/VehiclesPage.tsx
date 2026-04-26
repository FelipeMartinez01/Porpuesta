import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import VehicleFilters from "../components/VehicleFilters";
import VehicleTable from "../components/VehicleTable";
import VehicleDetailCard from "../components/VehicleDetailCard";
import VehicleCreateForm from "../components/VehicleCreateForm";
import VehicleEditModal from "../components/VehicleEditModal";
import type { Vehicle } from "../types/vehicle";
import type { Carrier, Sector } from "../types/catalogs";
import type { Shipment } from "../types/shipment";

export default function VehiclesPage() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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
      const [carriersResponse, sectorsResponse, shipmentsResponse] =
        await Promise.all([
          api.get<Carrier[]>("/carriers/"),
          api.get<Sector[]>("/sectors/"),
          api.get<Shipment[]>("/shipments/"),
        ]);

      setCarriers(carriersResponse.data);
      setSectors(sectorsResponse.data);
      setShipments(shipmentsResponse.data);
    } catch (error) {
      console.error("Error cargando catálogos", error);
      alert("No se pudieron cargar porteadores, sectores o BL");
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      await fetchVehicles();

      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(null);
      }
    } catch (error) {
      console.error("Error eliminando vehículo", error);
      alert("No se pudo eliminar el vehículo");
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
          <p style={styles.subtitle}>Consulta y gestiona los vehículos.</p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.dashboardButton}
            onClick={() => navigate("/shipments-dashboard")}
          >
            Dashboard BL
          </button>

          <button style={styles.createButton} onClick={() => setCreateOpen(true)}>
            + Agregar vehículo
          </button>
        </div>
      </div>

      {createOpen ? (
        <VehicleCreateForm
          carriers={carriers}
          sectors={sectors}
          shipments={shipments}
          onCreated={async () => {
            setCreateOpen(false);
            await fetchVehicles();
            await fetchCatalogs();
          }}
          onCancel={() => setCreateOpen(false)}
        />
      ) : null}

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
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        </div>

        <div style={styles.detailArea}>
          <VehicleDetailCard vehicle={selectedVehicle} />
        </div>
      </div>

      <VehicleEditModal
        vehicle={editingVehicle}
        carriers={carriers}
        sectors={sectors}
        shipments={shipments}
        onClose={() => setEditingVehicle(null)}
        onUpdated={async () => {
          await fetchVehicles();

          if (editingVehicle) {
            const updated = await api.get<Vehicle>(`/vehicles/${editingVehicle.id}`);
            setSelectedVehicle(updated.data);
          }
        }}
      />
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
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
  createButton: {
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  dashboardButton: {
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  loading: {
    marginBottom: "16px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns:
      window.innerWidth < 980
        ? "1fr"
        : "minmax(0, 2fr) minmax(300px, 1fr)",
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