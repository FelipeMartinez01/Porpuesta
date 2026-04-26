import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function ChangePasswordPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!password.trim() || !confirm.trim()) {
      alert("Completa todos los campos");
      return;
    }

    if (password !== confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      await api.patch(`/auth/users/${user?.id}/password`, {
        new_password: password,
      });

      await refreshUser();

      alert("Contraseña actualizada correctamente");

      navigate("/");
    } catch (error) {
      console.error("Error cambiando contraseña", error);
      alert("No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Cambio obligatorio de contraseña</h2>

        <p style={styles.text}>
          Debes cambiar tu contraseña para continuar usando el sistema.
        </p>

        <input
          style={styles.input}
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button style={styles.button} onClick={handleChange} disabled={loading}>
          {loading ? "Guardando..." : "Cambiar contraseña"}
        </button>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#111827",
    padding: "20px",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  title: {
    margin: 0,
    fontSize: "22px",
  },
  text: {
    margin: 0,
    color: "#6b7280",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },
  button: {
    padding: "12px",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    marginTop: "8px",
  },
  logoutButton: {
    padding: "10px",
    borderRadius: "10px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
  },
};