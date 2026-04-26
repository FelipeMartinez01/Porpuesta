import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Vehicle } from "../types/vehicle";
import type { Carrier, Sector } from "../types/catalogs";
import type { Shipment } from "../types/shipment";

type Props = {
  vehicle: Vehicle | null;
  carriers: Carrier[];
  sectors: Sector[];
  shipments: Shipment[];
  onClose: () => void;
  onUpdated: () => void;
};

export default function VehicleEditModal({
  vehicle,
  carriers,
  sectors,
  shipments,
  onClose,
  onUpdated,
}: Props) {
  const [vin, setVin] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vehicle) return;

    setVin(vehicle.vin ?? "");
    setShipmentId(vehicle.shipment_id ? String(vehicle.shipment_id) : "");
    setColor(vehicle.color ?? "");
    setBrand(vehicle.brand ?? "");
    setModel(vehicle.model ?? "");
    setVehicleYear(vehicle.vehicle_year ? String(vehicle.vehicle_year) : "");
    setCarrierId(vehicle.carrier_id ? String(vehicle.carrier_id) : "");
    setSectorId(vehicle.sector_id ? String(vehicle.sector_id) : "");
    setNotes(vehicle.notes ?? "");
  }, [vehicle]);

  if (!vehicle) return null;

  const handleUpdate = async () => {
    if (!vin.trim()) {
      alert("El VIN es obligatorio");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/vehicles/${vehicle.id}`, {
        vin: vin.trim(),
        shipment_id: shipmentId ? Number(shipmentId) : null,
        color: color || null,
        brand: brand || null,
        model: model || null,
        vehicle_year: vehicleYear ? Number(vehicleYear) : null,
        carrier_id: carrierId ? Number(carrierId) : null,
        sector_id: sectorId ? Number(sectorId) : null,
        notes: notes || null,
      });

      alert("Vehículo actualizado correctamente");
      onUpdated();
      onClose();
    } catch (error) {
      console.error("Error actualizando vehículo", error);
      alert("No se pudo actualizar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Editar vehículo</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

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
          <button style={styles.secondaryButton} onClick={onClose} disabled={loading}>
            Cancelar
          </button>

          <button style={styles.primaryButton} onClick={handleUpdate} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    width: "100%",
    maxWidth: "820px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: {
    margin: 0,
  },
  closeButton: {
    border: "none",
    background: "#f3f4f6",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
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
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
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