import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Carrier, Sector } from "../types/catalogs";
import type { Shipment } from "../types/shipment";

type Props = {
  carriers: Carrier[];
  sectors: Sector[];
  onCreated: () => void;
  onCancel: () => void;
};

export default function VehicleCreateForm({
  carriers,
  sectors,
  onCreated,
  onCancel,
}: Props) {
  const [vin, setVin] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchShipments = async () => {
    try {
      const response = await api.get<Shipment[]>("/shipments/");
      setShipments(response.data);
    } catch (error) {
      console.error("Error cargando BL", error);
      alert("No se pudieron cargar los BL");
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleCreate = async () => {
    if (!vin.trim()) {
      alert("El VIN es obligatorio");
      return;
    }

    const selectedShipment = shipments.find((s) => String(s.id) === shipmentId);

    try {
      setLoading(true);

      await api.post("/vehicles/", {
        vin: vin.trim(),
        bl: selectedShipment?.bl_number ?? null,
        shipment_id: shipmentId ? Number(shipmentId) : null,
        color: color || null,
        brand: brand || null,
        model: model || null,
        vehicle_year: vehicleYear ? Number(vehicleYear) : null,
        carrier_id: carrierId ? Number(carrierId) : null,
        sector_id: sectorId ? Number(sectorId) : null,
        slot_id: null,
        status: "FALTANTE",
        photo_url: null,
        notes: notes || null,
      });

      alert("Vehículo creado correctamente");

      setVin("");
      setShipmentId("");
      setColor("");
      setBrand("");
      setModel("");
      setVehicleYear("");
      setCarrierId("");
      setSectorId("");
      setNotes("");

      onCreated();
    } catch (error) {
      console.error("Error creando vehículo", error);
      alert("No se pudo crear el vehículo. Revisa si el VIN ya existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Agregar vehículo manualmente</h2>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label style={styles.label}>VIN *</label>
          <input
            style={styles.input}
            value={vin}
            onChange={(e) => setVin(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>BL / Embarque</label>
          <select
            style={styles.input}
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
          >
            <option value="">Sin BL</option>
            {shipments.map((shipment) => (
              <option key={shipment.id} value={shipment.id}>
                {shipment.bl_number} - {shipment.vessel_name ?? "Sin nave"} /{" "}
                {shipment.voyage_number ?? "Sin viaje"}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Color</label>
          <input
            style={styles.input}
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Marca</label>
          <input
            style={styles.input}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Modelo</label>
          <input
            style={styles.input}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Año</label>
          <input
            style={styles.input}
            type="number"
            value={vehicleYear}
            onChange={(e) => setVehicleYear(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Porteador</label>
          <select
            style={styles.input}
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
          >
            <option value="">Sin porteador</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Sector</label>
          <select
            style={styles.input}
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
          >
            <option value="">Sin sector</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Notas</label>
          <textarea
            style={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.actions}>
        <button
          style={styles.primaryButton}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear vehículo"}
        </button>

        <button
          style={styles.secondaryButton}
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  title: {
    marginTop: 0,
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
  textarea: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    minHeight: "100px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};