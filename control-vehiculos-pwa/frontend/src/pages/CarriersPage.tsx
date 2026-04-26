import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { api } from "../api/client";
import type { Carrier } from "../types/catalogs";

type CarrierWithRepresentative = Carrier & {
  representative?: string | null;
};

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<CarrierWithRepresentative[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    rut: "",
    representative: "",
    email: "",
    phone: "",
  });

  const fetchCarriers = async () => {
    try {
      setLoading(true);
      const res = await api.get<CarrierWithRepresentative[]>("/carriers/");
      setCarriers(res.data);
    } catch (error) {
      console.error("Error cargando porteadores", error);
      alert("No se pudieron cargar los porteadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.rut.trim()) {
      alert("Nombre y RUT son obligatorios");
      return;
    }

    try {
      await api.post("/carriers/", {
        name: form.name.trim(),
        rut: form.rut.trim(),
        representative: form.representative || null,
        email: form.email || null,
        phone: form.phone || null,
      });

      alert("Porteador creado correctamente");

      setForm({
        name: "",
        rut: "",
        representative: "",
        email: "",
        phone: "",
      });

      await fetchCarriers();
    } catch (error) {
      console.error("Error creando porteador", error);
      alert("No se pudo crear el porteador");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Porteadores</h1>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Crear porteador</h2>

        <div style={styles.grid}>
          <input
            style={styles.input}
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="RUT"
            value={form.rut}
            onChange={(e) => handleChange("rut", e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Representante"
            value={form.representative}
            onChange={(e) => handleChange("representative", e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Celular"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>

        <button style={styles.button} onClick={handleCreate}>
          Crear porteador
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado</h2>

        {loading ? <p>Cargando...</p> : null}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>RUT</th>
                <th style={styles.th}>Representante</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Celular</th>
              </tr>
            </thead>

            <tbody>
              {carriers.length === 0 ? (
                <tr>
                  <td style={styles.emptyCell} colSpan={5}>
                    No hay porteadores registrados.
                  </td>
                </tr>
              ) : (
                carriers.map((c) => (
                  <tr key={c.id}>
                    <td style={styles.td}>{c.name}</td>
                    <td style={styles.td}>{c.rut}</td>
                    <td style={styles.td}>{c.representative ?? "-"}</td>
                    <td style={styles.td}>{c.email ?? "-"}</td>
                    <td style={styles.td}>{c.phone ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    marginBottom: "20px",
    fontSize: "32px",
  },
  sectionTitle: {
    marginTop: 0,
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  button: {
    padding: "12px 16px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    padding: "12px",
    background: "#f9fafb",
    fontSize: "13px",
  },
  td: {
    borderBottom: "1px solid #f0f0f0",
    padding: "12px",
    fontSize: "14px",
  },
  emptyCell: {
    padding: "24px",
    textAlign: "center",
    color: "#6b7280",
  },
};