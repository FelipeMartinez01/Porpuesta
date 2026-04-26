import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Props = {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
};

type SidebarLink = {
  to: string;
  label: string;
  roles: string[];
};

const links: SidebarLink[] = [
  {
    to: "/",
    label: "Dashboard",
    roles: ["ADMIN", "SUPERVISOR", "OPERADOR", "CONTROL_DOCUMENTO"],
  },
  {
    to: "/dashboard-general",
    label: "Dashboard general",
    roles: ["ADMIN"],
  },
  {
    to: "/users",
    label: "Usuarios",
    roles: ["ADMIN"],
  },
  {
    to: "/vehicles",
    label: "Vehículos",
    roles: ["ADMIN", "SUPERVISOR", "OPERADOR"],
  },
  {
    to: "/upload",
    label: "Carga masiva",
    roles: ["ADMIN", "CONTROL_DOCUMENTO"],
  },
  {
    to: "/reception",
    label: "Recepción",
    roles: ["ADMIN", "SUPERVISOR", "OPERADOR"],
  },
  {
    to: "/parking-map",
    label: "Mapa de posiciones",
    roles: ["ADMIN", "SUPERVISOR", "OPERADOR"],
  },
  {
    to: "/dispatch-direct",
    label: "Despacho directo",
    roles: ["ADMIN", "SUPERVISOR", "OPERADOR"],
  },
  {
    to: "/dispatch-yard",
    label: "Despacho patio",
    roles: ["ADMIN", "SUPERVISOR", "OPERADOR"],
  },
  {
    to: "/logistics",
    label: "Logística",
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    to: "/carriers",
    label: "Porteadores",
    roles: ["ADMIN"],
  },
  {
    to: "/alerts",
    label: "Alertas",
    roles: ["ADMIN"],
  },
];

type AlertsCounterResponse = {
  total_alerts: number;
};

export default function Sidebar({
  isMobile = false,
  isOpen = false,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [alertsCount, setAlertsCount] = useState(0);

  const userRole = user?.role ?? "";

  const visibleLinks = links.filter((link) => link.roles.includes(userRole));

  const fetchAlertsCount = async () => {
    if (userRole !== "ADMIN") {
      setAlertsCount(0);
      return;
    }

    try {
      const response = await api.get<AlertsCounterResponse>("/alerts/");
      setAlertsCount(response.data.total_alerts ?? 0);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

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
  }, [userRole]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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

      <div style={styles.userBox}>
        <strong>{user?.username ?? "Usuario"}</strong>
        <span>{user?.role ?? "-"}</span>
      </div>

      <nav style={styles.nav}>
        {visibleLinks.map((link) => {
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

      <button style={styles.logoutButton} onClick={handleLogout}>
        Cerrar sesión
      </button>
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
    gap: "18px",
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
  userBox: {
    background: "#1f2937",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
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
  logoutButton: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#991b1b",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
};