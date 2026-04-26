import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Vessel, Voyage, Shipment } from "../types/shipment";

export default function LogisticsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [vesselName, setVesselName] = useState("");
  const [voyageNumber, setVoyageNumber] = useState("");
  const [selectedVessel, setSelectedVessel] = useState("");
  const [selectedVoyage, setSelectedVoyage] = useState("");
  const [blNumber, setBlNumber] = useState("");

  const fetchAll = async () => {
    const [v, vo, sh] = await Promise.all([
      api.get<Vessel[]>("/vessels/"),
      api.get<Voyage[]>("/voyages/"),
      api.get<Shipment[]>("/shipments/"),
    ]);

    setVessels(v.data);
    setVoyages(vo.data);
    setShipments(sh.data);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 🚢 CREAR NAVE
  const createVessel = async () => {
    if (!vesselName.trim()) return alert("Nombre requerido");

    await api.post("/vessels/", { name: vesselName });
    setVesselName("");
    await fetchAll();
  };

  // 🧭 CREAR VIAJE
  const createVoyage = async () => {
    if (!selectedVessel) return alert("Selecciona nave");
    if (!voyageNumber.trim()) return alert("Número de viaje requerido");

    await api.post("/voyages/", {
      vessel_id: Number(selectedVessel),
      voyage_number: voyageNumber,
    });

    setVoyageNumber("");
    await fetchAll();
  };

  // 📦 CREAR BL
  const createShipment = async () => {
    if (!selectedVoyage) return alert("Selecciona viaje");
    if (!blNumber.trim()) return alert("BL requerido");

    await api.post("/shipments/", {
      voyage_id: Number(selectedVoyage),
      bl_number: blNumber,
    });

    setBlNumber("");
    await fetchAll();
  };

  return (
    <div style={styles.page}>
      <h1>Logística</h1>

      {/* 🚢 NAVE */}
      <div style={styles.card}>
        <h2>Crear Nave</h2>
        <input
          placeholder="Nombre nave"
          value={vesselName}
          onChange={(e) => setVesselName(e.target.value)}
          style={styles.input}
        />
        <button onClick={createVessel} style={styles.button}>
          Crear
        </button>
      </div>

      {/* 🧭 VIAJE */}
      <div style={styles.card}>
        <h2>Crear Viaje</h2>

        <select
          value={selectedVessel}
          onChange={(e) => setSelectedVessel(e.target.value)}
          style={styles.input}
        >
          <option value="">Selecciona nave</option>
          {vessels.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Número de viaje"
          value={voyageNumber}
          onChange={(e) => setVoyageNumber(e.target.value)}
          style={styles.input}
        />

        <button onClick={createVoyage} style={styles.button}>
          Crear
        </button>
      </div>

      {/* 📦 BL */}
      <div style={styles.card}>
        <h2>Crear BL</h2>

        <select
          value={selectedVoyage}
          onChange={(e) => setSelectedVoyage(e.target.value)}
          style={styles.input}
        >
          <option value="">Selecciona viaje</option>
          {voyages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.voyage_number} ({v.vessel_name})
            </option>
          ))}
        </select>

        <input
          placeholder="Número BL"
          value={blNumber}
          onChange={(e) => setBlNumber(e.target.value)}
          style={styles.input}
        />

        <button onClick={createShipment} style={styles.button}>
          Crear
        </button>
      </div>

      {/* 📊 LISTADO */}
      <div style={styles.card}>
        <h2>BL registrados</h2>

        {shipments.map((s) => (
          <div key={s.id} style={styles.item}>
            <strong>{s.bl_number}</strong> - {s.voyage_number} - {s.vessel_name}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "20px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "16px",
    border: "1px solid #e5e7eb",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
  },
  button: {
    padding: "10px 14px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  item: {
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
};