import type { ParkingSlot } from "../types/parking";

type Props = {
  slots: ParkingSlot[];
  selectedSlotId: number | null;
  onSelectSlot: (slot: ParkingSlot) => void;
};

function getSlotStyle(slot: ParkingSlot, selected: boolean): React.CSSProperties {
  let background = "#dcfce7";
  let color = "#166534";
  let border = "2px solid transparent";

  if (slot.visual_status === "SALIDA") {
    background = "#fef3c7";
    color = "#92400e";
  }

  if (slot.visual_status === "OCUPADO") {
    background = "#fee2e2";
    color = "#991b1b";
  }

  if (selected) {
    border = "2px solid #111827";
  }

  return {
    background,
    color,
    border,
    borderRadius: "14px",
    padding: "18px 10px",
    textAlign: "center",
    fontWeight: 700,
    cursor: slot.visual_status === "OCUPADO" ? "not-allowed" : "pointer",
    opacity: slot.visual_status === "OCUPADO" ? 0.65 : 1,
    userSelect: "none",
  };
}

export default function ParkingGrid({
  slots,
  selectedSlotId,
  onSelectSlot,
}: Props) {
  return (
    <div>
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "#dcfce7" }} /> Disponible
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "#fef3c7" }} /> Salida
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "#fee2e2" }} /> Ocupado
        </span>
      </div>

      <div style={styles.grid}>
        {slots.map((slot) => (
          <div
            key={slot.id}
            style={getSlotStyle(slot, selectedSlotId === slot.id)}
            onClick={() => {
              if (slot.visual_status !== "OCUPADO") {
                onSelectSlot(slot);
              }
            }}
          >
            <div>{slot.code}</div>
            <div style={styles.subtext}>{slot.visual_status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  legend: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
  dot: {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    display: "inline-block",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: "12px",
  },
  subtext: {
    marginTop: "6px",
    fontSize: "12px",
    fontWeight: 600,
  },
};