import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Vessel, Voyage, Shipment } from "../types/shipment";

export default function LogisticsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [vesselName, setVesselName] = useState("");
  const [voyageNumber, setVoyageNumber] = useState("");
  const [voyageOrigin, setVoyageOrigin] = useState("");
  const [voyageDestination, setVoyageDestination] = useState("Iquique");
  const [selectedVessel, setSelectedVessel] = useState("");
  const [selectedVoyage, setSelectedVoyage] = useState("");
  const [blNumber, setBlNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [v, vo, sh] = await Promise.all([
        api.get<Vessel[]>("/vessels/"),
        api.get<Voyage[]>("/voyages/"),
        api.get<Shipment[]>("/shipments/"),
      ]);

      setVessels(v.data);
      setVoyages(vo.data);
      setShipments(sh.data);
    } catch (error) {
      console.error("Error cargando logística", error);
      alert("No se pudo cargar la información logística");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const createVessel = async () => {
    if (!vesselName.trim()) {
      alert("Nombre de nave requerido");
      return;
    }

    try {
      setLoading(true);

      await api.post("/vessels/", {
        name: vesselName.trim(),
      });

      setVesselName("");
      await fetchAll();
    } catch (error) {
      console.error("Error creando nave", error);
      alert("No se pudo crear la nave. Revisa si ya existe.");
    } finally {
      setLoading(false);
    }
  };

  const createVoyage = async () => {
    if (!selectedVessel) {
      alert("Selecciona una nave");
      return;
    }

    if (!voyageNumber.trim()) {
      alert("Número de viaje requerido");
      return;
    }

    try {
      setLoading(true);

      await api.post("/voyages/", {
        vessel_id: Number(selectedVessel),
        voyage_number: voyageNumber.trim(),
        origin: voyageOrigin || null,
        destination: voyageDestination || null,
      });

      setVoyageNumber("");
      setVoyageOrigin("");
      setVoyageDestination("Iquique");
      await fetchAll();
    } catch (error) {
      console.error("Error creando viaje", error);
      alert("No se pudo crear el viaje");
    } finally {
      setLoading(false);
    }
  };

  const createShipment = async () => {
    if (!selectedVoyage) {
      alert("Selecciona un viaje");
      return;
    }

    if (!blNumber.trim()) {
      alert("BL requerido");
      return;
    }

    try {
      setLoading(true);

      await api.post("/shipments/", {
        voyage_id: Number(selectedVoyage),
        bl_number: blNumber.trim(),
      });

      setBlNumber("");
      await fetchAll();
    } catch (error) {
      console.error("Error creando BL", error);
      alert("No se pudo crear el BL. Revisa si ya existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Logística</h1>
          <p style={styles.subtitle}>Gestiona naves, viajes y BL.</p>
        </div>

        <button style={styles.secondaryButton} onClick={fetchAll} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Crear Nave</h2>

        <input
          placeholder="Nombre nave"
          value={vesselName}
          onChange={(e) => setVesselName(e.target.value)}
          style={styles.input}
        />

        <button onClick={createVessel} style={styles.button} disabled={loading}>
          Crear nave
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Crear Viaje</h2>

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

        <input
          placeholder="Origen"
          value={voyageOrigin}
          onChange={(e) => setVoyageOrigin(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Destino"
          value={voyageDestination}
          onChange={(e) => setVoyageDestination(e.target.value)}
          style={styles.input}
        />

        <button onClick={createVoyage} style={styles.button} disabled={loading}>
          Crear viaje
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Crear BL</h2>

        <select
          value={selectedVoyage}
          onChange={(e) => setSelectedVoyage(e.target.value)}
          style={styles.input}
        >
          <option value="">Selecciona viaje</option>
          {voyages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.voyage_number} ({v.vessel_name ?? "Sin nave"})
            </option>
          ))}
        </select>

        <input
          placeholder="Número BL"
          value={blNumber}
          onChange={(e) => setBlNumber(e.target.value)}
          style={styles.input}
        />

        <button onClick={createShipment} style={styles.button} disabled={loading}>
          Crear BL
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>BL registrados</h2>

        {shipments.length === 0 ? (
          <p style={styles.empty}>No hay BL registrados.</p>
        ) : (
          shipments.map((s) => (
            <div key={s.id} style={styles.item}>
              <strong>{s.bl_number}</strong>
              <span>
                {s.voyage_number ?? "Sin viaje"} · {s.vessel_name ?? "Sin nave"}
              </span>
            </div>
          ))
        )}
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    marginTop: 0,
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 14px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "10px 14px",
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },
  item: {
    padding: "10px 0",
    borderBottom: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  empty: {
    color: "#6b7280",
  },
};