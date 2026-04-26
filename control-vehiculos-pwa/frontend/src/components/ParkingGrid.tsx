import type { ParkingSlot, SlotVehicleInfo } from "../types/parking";

type Props = {
  slots: ParkingSlot[];
  selectedSlotId: number | null;
  highlightedSlotId: number | null;
  slotVehicles: Record<number, SlotVehicleInfo>;
  onSelectSlot: (slot: ParkingSlot) => void;
};

function getSlotParts(code: string) {
  const match = code.trim().match(/^([A-Za-z]+)(\d+)$/);

  if (!match) {
    return {
      letter: code.toUpperCase(),
      number: 0,
    };
  }

  return {
    letter: match[1].toUpperCase(),
    number: Number(match[2]),
  };
}

function getLetters(slots: ParkingSlot[]) {
  return Array.from(new Set(slots.map((slot) => getSlotParts(slot.code).letter))).sort(
    (a, b) => a.localeCompare(b)
  );
}

function getSlotsByLetter(slots: ParkingSlot[], letter: string) {
  return slots
    .filter((slot) => getSlotParts(slot.code).letter === letter)
    .sort((a, b) => getSlotParts(a.code).number - getSlotParts(b.code).number);
}

function getSlotStyle(
  slot: ParkingSlot,
  selected: boolean,
  highlighted: boolean
): React.CSSProperties {
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

  if (highlighted) {
    border = "3px solid #2563eb";
  }

  return {
    background,
    color,
    border,
    borderRadius: "14px",
    padding: "12px 8px",
    textAlign: "center",
    fontWeight: 700,
    cursor: "pointer",
    userSelect: "none",
    minHeight: "92px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "5px",
    boxShadow: highlighted
      ? "0 0 0 5px rgba(37,99,235,0.18)"
      : selected
      ? "0 0 0 3px rgba(17,24,39,0.15)"
      : "none",
    transform: highlighted ? "scale(1.03)" : "scale(1)",
  };
}

export default function ParkingGrid({
  slots,
  selectedSlotId,
  highlightedSlotId,
  slotVehicles,
  onSelectSlot,
}: Props) {
  const letters = getLetters(slots);

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
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: "#2563eb" }} /> Buscado
        </span>
      </div>

      <div style={styles.portHeader}>
        <div>
          <h3 style={styles.portTitle}>Sector 8 - Layout inteligente de patio</h3>
          <p style={styles.portSubtitle}>
            Filas verticales con calles de circulación, búsqueda VIN y resaltado de ubicación.
          </p>
        </div>

        <div style={styles.gateBox}>Acceso / Salida</div>
      </div>

      {slots.length === 0 ? (
        <div style={styles.empty}>No hay slots para mostrar con este filtro.</div>
      ) : (
        <div style={styles.yardWrapper}>
          <div style={styles.yard}>
            {letters.map((letter, index) => {
              const letterSlots = getSlotsByLetter(slots, letter);

              return (
                <div key={letter} style={styles.blockGroup}>
                  <div style={styles.columnBlock}>
                    <div style={styles.columnTitle}>Fila {letter}</div>

                    <div style={styles.slotColumn}>
                      {letterSlots.map((slot) => {
                        const slotVehicle = slotVehicles[slot.id];
                        const selected = selectedSlotId === slot.id;
                        const highlighted = highlightedSlotId === slot.id;

                        return (
                          <div
                            key={slot.id}
                            style={getSlotStyle(slot, selected, highlighted)}
                            onClick={() => onSelectSlot(slot)}
                          >
                            <div style={styles.slotCode}>{slot.code}</div>
                            <div style={styles.subtext}>{slot.visual_status}</div>

                            {slotVehicle ? (
                              <div style={styles.vehicleInfo}>
                                <div style={styles.vin}>{slotVehicle.vin}</div>
                                <div style={styles.modelText}>
                                  {slotVehicle.brand ?? "-"} {slotVehicle.model ?? ""}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {index < letters.length - 1 ? (
                    <div style={styles.verticalRoad}>
                      <span>C</span>
                      <span>A</span>
                      <span>L</span>
                      <span>L</span>
                      <span>E</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  portHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  portTitle: {
    margin: 0,
    fontSize: "20px",
  },
  portSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  gateBox: {
    background: "#111827",
    color: "#fff",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: 800,
    textAlign: "center",
  },
  yardWrapper: {
    border: "2px solid #d1d5db",
    borderRadius: "18px",
    padding: "16px",
    background: "#f9fafb",
    overflowX: "auto",
  },
  yard: {
    display: "flex",
    alignItems: "stretch",
    gap: "14px",
    minWidth: "760px",
  },
  blockGroup: {
    display: "flex",
    alignItems: "stretch",
    gap: "14px",
  },
  columnBlock: {
    minWidth: "135px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  columnTitle: {
    textAlign: "center",
    fontWeight: 900,
    fontSize: "14px",
    color: "#111827",
    background: "#e5e7eb",
    borderRadius: "10px",
    padding: "8px",
    marginBottom: "10px",
  },
  slotColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  verticalRoad: {
    width: "44px",
    borderRadius: "14px",
    border: "1px dashed #9ca3af",
    background:
      "repeating-linear-gradient(180deg, #d1d5db 0 18px, #f9fafb 18px 32px)",
    color: "#374151",
    fontWeight: 900,
    fontSize: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "100%",
  },
  slotCode: {
    fontSize: "19px",
    fontWeight: 900,
  },
  subtext: {
    fontSize: "11px",
    fontWeight: 700,
  },
  vehicleInfo: {
    marginTop: "4px",
    fontSize: "10px",
    lineHeight: 1.2,
  },
  vin: {
    fontWeight: 800,
    wordBreak: "break-word",
  },
  modelText: {
    opacity: 0.9,
    marginTop: "2px",
  },
  empty: {
    padding: "24px",
    borderRadius: "14px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280",
    textAlign: "center",
  },
};