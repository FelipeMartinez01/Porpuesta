import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverUsername, setRecoverUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert("Ingresa usuario y contraseña");
      return;
    }

    try {
      setLoading(true);
      const loggedUser = await login(username.trim(), password);

      if (loggedUser.must_change_password) {
        navigate("/change-password");
        return;
      }

      navigate("/");
    } catch (error) {
      console.error("Error iniciando sesión", error);
      alert("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    const userToRecover = recoverUsername.trim() || username.trim();

    if (!userToRecover) {
      alert("Ingresa tu nombre de usuario para solicitar recuperación");
      return;
    }

    try {
      setRecoverLoading(true);

      await api.post("/auth/request-password-change", {
        username: userToRecover,
      });

      alert(
        `Solicitud enviada para el usuario "${userToRecover}". Un ADMIN podrá cambiar la contraseña desde el módulo Usuarios.`
      );

      setRecoverOpen(false);
      setRecoverUsername("");
    } catch (error) {
      console.error("Error solicitando recuperación", error);
      alert("No se pudo registrar la solicitud de recuperación");
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Control Vehículos</h2>
        <p style={styles.subtitle}>Ingresa con tu usuario para continuar</p>

        <input
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin();
            }
          }}
        />

        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? "Entrando..." : "Ingresar"}
        </button>

        <button
          style={styles.forgotButton}
          onClick={() => {
            setRecoverUsername(username);
            setRecoverOpen(true);
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {recoverOpen ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Recuperar contraseña</h3>

            <p style={styles.modalText}>
              Por seguridad, la contraseña debe ser restablecida por un usuario ADMIN.
              Ingresa tu usuario para solicitar la recuperación.
            </p>

            <input
              style={styles.input}
              placeholder="Usuario"
              value={recoverUsername}
              onChange={(e) => setRecoverUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRecover();
                }
              }}
            />

            <div style={styles.modalActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => setRecoverOpen(false)}
                disabled={recoverLoading}
              >
                Cancelar
              </button>

              <button
                style={styles.button}
                onClick={handleRecover}
                disabled={recoverLoading}
              >
                {recoverLoading ? "Enviando..." : "Solicitar recuperación"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
    fontSize: "28px",
  },
  subtitle: {
    margin: "0 0 12px",
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
  forgotButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 700,
    padding: "8px",
  },
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
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "22px",
  },
  modalText: {
    margin: 0,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  secondaryButton: {
    padding: "12px",
    borderRadius: "10px",
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontWeight: 800,
    marginTop: "8px",
  },
};