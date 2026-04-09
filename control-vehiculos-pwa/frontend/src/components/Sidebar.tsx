import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/vehicles", label: "Vehículos" },
  { to: "/upload", label: "Carga masiva" },
  { to: "/reception", label: "Recepción" },
  { to: "/parking-map", label: "Mapa de posiciones" },
];

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}>
        <h2 style={styles.logo}>Control Vehículos</h2>
        <p style={styles.subtitle}>Sistema de chequeo</p>
      </div>

      <nav style={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            {link.label}
          </NavLink>
        ))}
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
  },
  logoArea: {
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "16px",
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
  },
  activeLink: {
    background: "#1f2937",
    color: "#fff",
  },
};