import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);

      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styles.container}>
      {isMobile ? (
        <header style={styles.mobileHeader}>
          <button
            style={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div>
            <strong>Control Vehículos</strong>
            <div style={styles.mobileSubtitle}>Sistema de chequeo</div>
          </div>
        </header>
      ) : null}

      <Sidebar
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {isMobile && sidebarOpen ? (
        <div
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <main
        style={{
          ...styles.main,
          marginLeft: isMobile ? 0 : 260,
          paddingTop: isMobile ? 72 : 0,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#f3f4f6",
  },
  main: {
    minWidth: 0,
  },
  mobileHeader: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "64px",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 16px",
    zIndex: 1000,
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  menuButton: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "#1f2937",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer",
  },
  mobileSubtitle: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "2px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1001,
  },
};