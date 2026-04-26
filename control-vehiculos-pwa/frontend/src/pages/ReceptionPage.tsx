import { useEffect, useState } from "react";
import { api } from "../api/client";
import ReceptionSearch from "../components/ReceptionSearch";
import ReceptionForm from "../components/ReceptionForm";
import VinScanner from "../components/VinScanner";
import VehicleTimeline from "../components/VehicleTimeLine";
import type { Vehicle } from "../types/vehicle";
import type { ReceptionFormData } from "../types/reception";
import type { VehicleEvent } from "../types/vehicleEvent";

type ReceptionFilter = "FALTANTE" | "DIRECTO" | "ALMACENADO";

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
  const [filter, setFilter] = useState<ReceptionFilter>("FALTANTE");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
      const response = await api.get<VehicleEvent>(`/vehicles/${vehicleId}/events`);
      setEvents(response.data as any);
    } catch {
      setEvents([]);
    }
  };

  const fetchVehiclesByFilter = async (currentFilter: ReceptionFilter, vinValue = "") => {
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

  const selectVehicle = async (selected: Vehicle) => {
    setVehicle(selected);
    setFormData(mapVehicleToForm(selected));
    setSearchValue(selected.vin);
    await fetchVehicleEvents(selected.id);
    focusSearchInput();
  };

  const searchVehicle = async (vinValue: string) => {
    if (!vinValue.trim()) return;

    try {
      setLoading(true);

      const response = await api.get<Vehicle[]>("/vehicles/", {
        params: {
          vin: vinValue.trim(),
          status: filter,
        },
      });

      if (response.data.length === 0) {
        setVehicle(null);
        setEvents([]);
        return;
      }

      await selectVehicle(response.data[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleDetected = async (decodedText: string) => {
    setScannerOpen(false);
    setSearchValue(decodedText);
    await searchVehicle(decodedText);
    focusSearchInput();
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Recepción</h1>

      <ReceptionSearch
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        onSearch={() => searchVehicle(searchValue)}
        onOpenScanner={() => setScannerOpen(true)}
      />

      {scannerOpen && (
        <VinScanner
          onDetected={handleDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <div style={styles.layout}>
        <div style={styles.card}>
          {vehicles.map((item) => (
            <button
              key={item.id}
              style={{
                ...styles.vehicleItem,
                ...(vehicle?.id === item.id ? styles.active : {}),
              }}
              onClick={() => selectVehicle(item)}
            >
              <strong>{item.vin}</strong>
              <small>
                BL: {item.shipment_bl ?? "-"} · Nave:{" "}
                {item.vessel_name ?? "-"} · Viaje:{" "}
                {item.voyage_number ?? "-"}
              </small>
            </button>
          ))}
        </div>

        <div>
          {vehicle && (
            <div style={styles.infoCard}>
              <p><strong>VIN:</strong> {vehicle.vin}</p>
              <p><strong>BL:</strong> {vehicle.shipment_bl ?? "-"}</p>
              <p><strong>Nave:</strong> {vehicle.vessel_name ?? "-"}</p>
              <p><strong>Viaje:</strong> {vehicle.voyage_number ?? "-"}</p>
              <p><strong>Estado:</strong> {vehicle.status}</p>
              <p><strong>Sector:</strong> {vehicle.sector_name ?? "-"}</p>
              <p><strong>Porteador:</strong> {vehicle.carrier_name ?? "-"}</p>
            </div>
          )}

          {vehicle && (
            <ReceptionForm
              formData={formData}
              status={vehicle.status}
              onChange={(f, v) =>
                setFormData((p) => ({ ...p, [f]: v }))
              }
              onSave={() => {}}
              onMarkDirect={() => {}}
              onMarkStored={() => {}}
              onMarkTransit={() => {}}
              onDispatch={() => {}}
              loading={loading}
            />
          )}

          {vehicle && <VehicleTimeline events={events} />}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  title: { fontSize: 28 },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: { background: "#fff", padding: 16, borderRadius: 12 },
  vehicleItem: {
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  active: {
    border: "2px solid #000",
  },
  infoCard: {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
};