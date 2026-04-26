import { useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

const roles = ["ADMIN", "SUPERVISOR", "OPERADOR", "CONTROL_DOCUMENTO"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    role: "OPERADOR",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>("/auth/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error cargando usuarios", error);
      alert("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      alert("Usuario y contraseña son obligatorios");
      return;
    }

    try {
      await api.post("/auth/register", {
        username: form.username.trim(),
        password: form.password,
        full_name: form.full_name.trim() || null,
        email: form.email.trim() || null,
        role: form.role,
      });

      alert("Usuario creado correctamente");

      setForm({
        username: "",
        password: "",
        full_name: "",
        email: "",
        role: "OPERADOR",
      });

      await fetchUsers();
    } catch (error) {
      console.error("Error creando usuario", error);
      alert("No se pudo crear el usuario");
    }
  };

  const handleToggleActive = async (user: User) => {
    const action = user.is_active ? "desactivar" : "activar";
    const confirmed = confirm(`¿Seguro que quieres ${action} al usuario ${user.username}?`);

    if (!confirmed) return;

    try {
      await api.patch(`/auth/users/${user.id}/toggle-active`);
      await fetchUsers();
    } catch (error) {
      console.error("Error cambiando estado del usuario", error);
      alert("No se pudo actualizar el estado del usuario");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Usuarios</h1>
          <p style={styles.subtitle}>
            Administración de usuarios, roles y estado de acceso al sistema.
          </p>
        </div>

        <button style={styles.secondaryButton} onClick={fetchUsers}>
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Crear usuario</h2>

        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Usuario *</label>
            <input
              style={styles.input}
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña *</label>
            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Nombre completo</label>
            <input
              style={styles.input}
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Rol</label>
            <select
              style={styles.input}
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.primaryButton} onClick={handleCreate}>
            Crear usuario
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de usuarios</h2>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{user.full_name ?? "-"}</td>
                  <td style={styles.td}>{user.email ?? "-"}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{user.role}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(user.is_active ? styles.activeStatus : styles.inactiveStatus),
                      }}
                    >
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{
                        ...styles.toggleButton,
                        ...(user.is_active ? styles.disableButton : styles.enableButton),
                      }}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 ? (
          <div style={styles.empty}>No hay usuarios registrados.</div>
        ) : null}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
    maxWidth: "1440px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    marginBottom: "8px",
    fontSize: "32px",
  },
  subtitle: {
    margin: 0,
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  actions: {
    marginTop: "20px",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  badge: {
    background: "#111827",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  statusBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  activeStatus: {
    background: "#dcfce7",
    color: "#166534",
  },
  inactiveStatus: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  toggleButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  disableButton: {
    background: "#dc2626",
  },
  enableButton: {
    background: "#16a34a",
  },
  empty: {
    marginTop: "16px",
    padding: "18px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280",
    textAlign: "center",
  },
};