import { useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  role: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  must_change_password?: boolean;
};

const roles = ["ADMIN", "SUPERVISOR", "OPERADOR", "CONTROL_DOCUMENTO"];

const dashboardPermissions = [
  { value: "DASHBOARD_GENERAL", label: "Dashboard general" },
  { value: "DASHBOARD_BL", label: "Dashboard por BL" },
  { value: "ALERTAS", label: "Alertas" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

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

  const usersNeedPasswordChange = users.filter(
    (user) => user.must_change_password
  );

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
        permissions: [],
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
    const confirmed = confirm(
      `¿Seguro que quieres ${action} al usuario ${user.username}?`
    );

    if (!confirmed) return;

    try {
      await api.patch(`/auth/users/${user.id}/toggle-active`);
      await fetchUsers();
    } catch (error) {
      console.error("Error cambiando estado del usuario", error);
      alert("No se pudo actualizar el estado del usuario");
    }
  };

  const handlePermissionChange = async (
    user: User,
    permission: string,
    checked: boolean
  ) => {
    const currentPermissions = user.permissions ?? [];

    const newPermissions = checked
      ? [...currentPermissions, permission]
      : currentPermissions.filter((item) => item !== permission);

    try {
      await api.patch(`/auth/users/${user.id}/permissions`, {
        permissions: newPermissions,
      });

      await fetchUsers();
    } catch (error) {
      console.error("Error actualizando permisos", error);
      alert("No se pudieron actualizar los permisos");
    }
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
  };

  const closePasswordModal = () => {
    setSelectedUser(null);
    setNewPassword("");
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;

    if (!newPassword.trim()) {
      alert("Debes ingresar una nueva contraseña");
      return;
    }

    if (newPassword.trim().length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const confirmed = confirm(
      `¿Seguro que quieres cambiar la contraseña de ${selectedUser.username}?`
    );

    if (!confirmed) return;

    try {
      await api.patch(`/auth/users/${selectedUser.id}/password`, {
        new_password: newPassword.trim(),
      });

      alert("Contraseña cambiada correctamente");
      closePasswordModal();
      await fetchUsers();
    } catch (error) {
      console.error("Error cambiando contraseña", error);
      alert("No se pudo cambiar la contraseña");
    }
  };

  const handleMarkPasswordChange = async (user: User) => {
    try {
      await api.patch(`/auth/users/${user.id}/require-password-change`, {
        must_change_password: true,
      });

      alert(`Se marcó a ${user.username} para cambio de contraseña`);
      await fetchUsers();
    } catch (error) {
      console.error("Error marcando cambio de contraseña", error);
      alert("No se pudo marcar el cambio de contraseña");
    }
  };

  const handleClearPasswordChange = async (user: User) => {
    try {
      await api.patch(`/auth/users/${user.id}/require-password-change`, {
        must_change_password: false,
      });

      alert(`Se quitó la alerta de cambio de contraseña para ${user.username}`);
      await fetchUsers();
    } catch (error) {
      console.error("Error quitando alerta", error);
      alert("No se pudo quitar la alerta");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Usuarios</h1>
          <p style={styles.subtitle}>
            Administración de usuarios, roles, permisos, contraseñas y estado de acceso.
          </p>
        </div>

        <button style={styles.secondaryButton} onClick={fetchUsers}>
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {usersNeedPasswordChange.length > 0 ? (
        <div style={styles.alertBox}>
          <strong>Usuarios que necesitan cambio de contraseña:</strong>{" "}
          {usersNeedPasswordChange.map((user) => user.username).join(", ")}
        </div>
      ) : null}

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
                <th style={styles.th}>Dashboards</th>
                <th style={styles.th}>Contraseña</th>
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
                    <div style={styles.permissionBox}>
                      {dashboardPermissions.map((permission) => (
                        <label key={permission.value} style={styles.permissionItem}>
                          <input
                            type="checkbox"
                            checked={(user.permissions ?? []).includes(permission.value)}
                            onChange={(e) =>
                              handlePermissionChange(
                                user,
                                permission.value,
                                e.target.checked
                              )
                            }
                          />
                          {permission.label}
                        </label>
                      ))}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.passwordActions}>
                      {user.must_change_password ? (
                        <span style={styles.passwordWarning}>
                          Requiere cambio
                        </span>
                      ) : (
                        <span style={styles.passwordOk}>OK</span>
                      )}

                      <button
                        style={styles.passwordButton}
                        onClick={() => openPasswordModal(user)}
                      >
                        Cambiar
                      </button>

                      {user.must_change_password ? (
                        <button
                          style={styles.clearAlertButton}
                          onClick={() => handleClearPasswordChange(user)}
                        >
                          Quitar alerta
                        </button>
                      ) : (
                        <button
                          style={styles.warningButton}
                          onClick={() => handleMarkPasswordChange(user)}
                        >
                          Marcar alerta
                        </button>
                      )}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(user.is_active
                          ? styles.activeStatus
                          : styles.inactiveStatus),
                      }}
                    >
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <button
                      style={{
                        ...styles.toggleButton,
                        ...(user.is_active
                          ? styles.disableButton
                          : styles.enableButton),
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

      {selectedUser ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              Cambiar contraseña
            </h2>

            <p style={styles.modalText}>
              Usuario: <strong>{selectedUser.username}</strong>
            </p>

            <div style={styles.field}>
              <label style={styles.label}>Nueva contraseña</label>
              <input
                style={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.secondaryButton} onClick={closePasswordModal}>
                Cancelar
              </button>

              <button style={styles.primaryButton} onClick={handleChangePassword}>
                Guardar contraseña
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  alertBox: {
    background: "#fef3c7",
    border: "1px solid #f59e0b",
    color: "#92400e",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "14px",
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
    verticalAlign: "top",
  },
  badge: {
    background: "#111827",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  permissionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  permissionItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#374151",
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
  passwordActions: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  passwordWarning: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    textAlign: "center",
  },
  passwordOk: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    textAlign: "center",
  },
  passwordButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  warningButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#f59e0b",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  clearAlertButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#6b7280",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px",
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: "8px",
  },
  modalText: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#374151",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
  },
};