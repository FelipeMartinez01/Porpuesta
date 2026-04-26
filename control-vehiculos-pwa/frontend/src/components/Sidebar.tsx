import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api/client";

type Props = {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
};

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/vehicles", label: "Vehículos" },
  { to: "/upload", label: "Carga masiva" },
  { to: "/reception", label: "Recepción" },
  { to: "/parking-map", label: "Mapa de posiciones" },
  { to: "/dispatch-direct", label: "Despacho directo" },
  { to: "/dispatch-yard", label: "Despacho patio" },
  { to: "/logistics", label: "Logística" },
  { to: "/carriers", label: "Porteadores" },
  { to: "/alerts", label: "Alertas" },
  { to: "/dashboard-general", label: "Dashboard general" },
];

type AlertsCounterResponse = {
  total_alerts: number;
};

export default function Sidebar({
  isMobile = false,
  isOpen = false,
  onClose,
}: Props) {
  const [alertsCount, setAlertsCount] = useState(0);

  const fetchAlertsCount = async () => {
    try {
      const response = await api.get<AlertsCounterResponse>("/alerts/");
      setAlertsCount(response.data.total_alerts ?? 0);
    } catch (error) {
      console.error("Error cargando contador de alertas", error);
      setAlertsCount(0);
    }
  };

  useEffect(() => {
    fetchAlertsCount();

    const interval = setInterval(() => {
      fetchAlertsCount();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      style={{
        ...styles.sidebar,
        position: "fixed",
        left: isMobile ? (isOpen ? 0 : "-280px") : 0,
        top: 0,
        bottom: 0,
        zIndex: isMobile ? 1002 : 999,
        transition: "left 0.25s ease",
      }}
    >
      <div style={styles.logoArea}>
        <div style={styles.logoTop}>
          <div>
            <h2 style={styles.logo}>Control Vehículos</h2>
            <p style={styles.subtitle}>Sistema de chequeo</p>
          </div>

          {isMobile ? (
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <nav style={styles.nav}>
        {links.map((link) => {
          const isAlertsLink = link.to === "/alerts";

          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={isMobile ? onClose : undefined}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              <span>{link.label}</span>

              {isAlertsLink && alertsCount > 0 ? (
                <span style={styles.badge}>{alertsCount}</span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "#111827",
    color: "#fff",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  logoArea: {
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "16px",
  },
  logoTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  logo: {
    margin: 0,
    fontSize: "22px",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#9ca3af",
    fontSize: "14px",
  },
  closeButton: {
    border: "none",
    background: "#1f2937",
    color: "#fff",
    borderRadius: "10px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 800,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  link: {
    padding: "12px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#e5e7eb",
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  activeLink: {
    background: "#1f2937",
    color: "#fff",
  },
  badge: {
    minWidth: "24px",
    height: "24px",
    padding: "0 7px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 900,
  },
};