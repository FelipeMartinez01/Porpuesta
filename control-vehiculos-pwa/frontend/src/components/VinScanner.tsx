import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onDetected: (value: string) => void;
  onClose: () => void;
};

export default function VinScanner({ onDetected, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "vin-scanner-region";

  useEffect(() => {
    let active = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.7778,
          },
          async (decodedText) => {
            if (!active) return;

            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }
            } catch {
              // ignorar error al detener
            }

            try {
              await scanner.clear();
            } catch {
              // ignorar error al limpiar
            }

            onDetected(decodedText);
          },
          () => {
            // ignorar errores de lectura por frame
          }
        );
      } catch (error) {
        console.error("No se pudo iniciar la cámara", error);
        alert(
          "No se pudo abrir la cámara. En celular, la cámara en vivo normalmente requiere HTTPS. Usa ingreso manual o una URL segura."
        );
        onClose();
      }
    };

    startScanner();

    return () => {
      active = false;

      const cleanup = async () => {
        try {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
          }
        } catch {
          // ignorar
        }

        try {
          await scannerRef.current?.clear();
        } catch {
          // ignorar
        }
      };

      cleanup();
    };
  }, [onDetected, onClose]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Escanear VIN</h3>
          <button style={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <p style={styles.text}>
          Apunta la cámara al código de barras del vehículo.
        </p>

        <div id={regionId} style={styles.scannerRegion} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },
  modal: {
    width: "100%",
    maxWidth: "720px",
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  title: {
    margin: 0,
  },
  closeButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
  },
  text: {
    marginTop: 0,
    color: "#6b7280",
  },
  scannerRegion: {
    width: "100%",
    minHeight: "320px",
    borderRadius: "12px",
    overflow: "hidden",
  },
};