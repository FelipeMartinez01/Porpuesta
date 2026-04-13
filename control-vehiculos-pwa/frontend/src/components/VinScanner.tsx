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
    let isMounted = true;

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
            if (!isMounted) return;

            try {
              await scanner.stop();
            } catch {
              // ignorar si ya se detuvo
            }

            onDetected(decodedText);
          },
          () => {
            // errores de frame ignorados
          }
        );
      } catch (error) {
        console.error("No se pudo iniciar la cámara", error);
        alert("No se pudo abrir la cámara en este dispositivo o navegador.");
        onClose();
      }
    };

    startScanner();

    return () => {
      isMounted = false;

      const stopScanner = async () => {
        try {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current?.clear();
        } catch {
          // ignorar errores al desmontar
        }
      };

      stopScanner();
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
          Apunta la cámara al código de barra del vehículo.
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
    background: "rgba(0,0,0,0.55)",
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