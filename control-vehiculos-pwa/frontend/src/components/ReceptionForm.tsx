import type { ReceptionFormData } from "../types/reception";

type Props = {
  formData: ReceptionFormData;
  onChange: (field: keyof ReceptionFormData, value: string) => void;
  onSave: () => void;
  onMarkTransit: () => void;
  loading: boolean;
};

export default function ReceptionForm({
  formData,
  onChange,
  onSave,
  onMarkTransit,
  loading,
}: Props) {
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Formulario de recepción</h2>

      <div style={styles.grid}>
        {/* VIN */}
        <div style={styles.field}>
          <label style={styles.label}>VIN / Código de barra</label>
          <input
            style={styles.input}
            value={formData.vin}
            onChange={(e) => onChange("vin", e.target.value)}
          />
        </div>

        {/* BL 🔥 */}
        <div style={styles.field}>
          <label style={styles.label}>BL (Bill of Lading)</label>
          <input
            style={styles.input}
            value={formData.bl}
            onChange={(e) => onChange("bl", e.target.value)}
            placeholder="Ej: BL123456"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Color</label>
          <input
            style={styles.input}
            value={formData.color}
            onChange={(e) => onChange("color", e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Marca</label>
          <input
            style={styles.input}
            value={formData.brand}
            onChange={(e) => onChange("brand", e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Modelo</label>
          <input
            style={styles.input}
            value={formData.model}
            onChange={(e) => onChange("model", e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Año</label>
          <input
            style={styles.input}
            type="number"
            value={formData.vehicle_year}
            onChange={(e) => onChange("vehicle_year", e.target.value)}
          />
        </div>

        <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Notas</label>
          <textarea
            style={styles.textarea}
            value={formData.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.secondaryButton} onClick={onSave} disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        <button style={styles.primaryButton} onClick={onMarkTransit} disabled={loading}>
          {loading ? "Procesando..." : "Marcar en tránsito"}
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
    minHeight: "110px",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
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