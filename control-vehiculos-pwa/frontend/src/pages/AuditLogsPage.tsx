import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

type AuditLog = {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  description: string;
  extra_data: Record<string, any> | null;
  created_at: string;
};

const actionLabels: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  CREATE_USER: "Creó usuario",
  UPDATE_PERMISSIONS: "Permisos",
  ADMIN_RESET_PASSWORD: "Cambió contraseña",
  REQUEST_PASSWORD_CHANGE: "Solicitud contraseña",
  CREATE_VEHICLE: "Creó vehículo",
  UPDATE_VEHICLE: "Actualizó vehículo",
  UPDATE_VEHICLE_STATUS: "Cambió estado",
  ASSIGN_VEHICLE_SLOT: "Asignó ubicación",
  DELETE_VEHICLE: "Eliminó vehículo",
};

function getActionStyle(action: string): React.CSSProperties {
  if (action.includes("DELETE")) return { background: "#fee2e2", color: "#991b1b" };
  if (action.includes("PASSWORD")) return { background: "#fef3c7", color: "#92400e" };
  if (action.includes("LOGIN")) return { background: "#dbeafe", color: "#1e40af" };
  if (action.includes("VEHICLE")) return { background: "#dcfce7", color: "#166534" };
  return { background: "#e5e7eb", color: "#374151" };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    username: "",
    action: "",
    entity: "",
    date_from: "",
    date_to: "",
    limit: "300",
  });

  const totalByUser = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((log) => {
      const key = log.username ?? "Sistema";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
  }, [logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params: Record<string, string> = {
        limit: filters.limit,
      };

      if (filters.username.trim()) params.username = filters.username.trim();
      if (filters.action.trim()) params.action = filters.action.trim();
      if (filters.entity.trim()) params.entity = filters.entity.trim();

      if (filters.date_from) {
        params.date_from = new Date(`${filters.date_from}T00:00:00`).toISOString();
      }

      if (filters.date_to) {
        params.date_to = new Date(`${filters.date_to}T23:59:59`).toISOString();
      }

      const response = await api.get<AuditLog[]>("/audit-logs", { params });
      setLogs(response.data);
    } catch (error) {
      console.error("Error cargando auditoría", error);
      alert("No se pudo cargar la auditoría");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const clearFilters = () => {
    setFilters({
      username: "",
      action: "",
      entity: "",
      date_from: "",
      date_to: "",
      limit: "300",
    });
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Usuario",
      "Accion",
      "Entidad",
      "ID Entidad",
      "Descripcion",
      "Fecha",
      "Detalle",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.username ?? "",
      log.action,
      log.entity ?? "",
      log.entity_id ?? "",
      log.description,
      new Date(log.created_at).toLocaleString(),
      JSON.stringify(log.extra_data ?? {}),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Auditoría del sistema</h1>
          <p style={styles.subtitle}>
            Registro de acciones por usuario: quién hizo qué, cuándo y sobre qué entidad.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={fetchLogs}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button style={styles.primaryButton} onClick={exportCSV}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Registros mostrados</span>
          <strong style={styles.summaryValue}>{logs.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Usuario más activo</span>
          <strong style={styles.summaryValue}>
            {totalByUser ? `${totalByUser[0]} (${totalByUser[1]})` : "-"}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Última acción</span>
          <strong style={styles.summaryValue}>
            {logs[0] ? new Date(logs[0].created_at).toLocaleString() : "-"}
          </strong>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtros</h2>

        <div style={styles.filtersGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Usuario</label>
            <input
              style={styles.input}
              value={filters.username}
              onChange={(e) => setFilters({ ...filters, username: e.target.value })}
              placeholder="admin, jorge..."
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Acción</label>
            <input
              style={styles.input}
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="LOGIN, VEHICLE..."
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Entidad</label>
            <input
              style={styles.input}
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
              placeholder="users, vehicles..."
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Desde</label>
            <input
              style={styles.input}
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Hasta</label>
            <input
              style={styles.input}
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Límite</label>
            <select
              style={styles.input}
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
            >
              <option value="100">100</option>
              <option value="300">300</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
            </select>
          </div>
        </div>

        <div style={styles.filterActions}>
          <button style={styles.primaryButton} onClick={fetchLogs}>
            Aplicar filtros
          </button>

          <button style={styles.secondaryButton} onClick={clearFilters}>
            Limpiar
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Registros</h2>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Acción</th>
                <th style={styles.th}>Entidad</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Detalle</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => {
                const expanded = expandedId === log.id;

                return (
                  <>
                    <tr key={log.id}>
                      <td style={styles.td}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td style={styles.td}>
                        <strong>{log.username ?? "Sistema"}</strong>
                      </td>

                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...getActionStyle(log.action) }}>
                          {actionLabels[log.action] ?? log.action}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {log.entity ?? "-"}
                        {log.entity_id ? (
                          <span style={styles.entityId}>#{log.entity_id}</span>
                        ) : null}
                      </td>

                      <td style={styles.td}>{log.description}</td>

                      <td style={styles.td}>
                        <button
                          style={styles.smallButton}
                          onClick={() => setExpandedId(expanded ? null : log.id)}
                        >
                          {expanded ? "Ocultar" : "Ver"}
                        </button>
                      </td>
                    </tr>

                    {expanded ? (
                      <tr>
                        <td style={styles.detailTd} colSpan={6}>
                          <pre style={styles.pre}>
                            {JSON.stringify(log.extra_data ?? {}, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {logs.length === 0 ? (
          <div style={styles.empty}>No hay registros de auditoría.</div>
        ) : null}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
    maxWidth: "1500px",
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
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  summaryCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 700,
  },
  summaryValue: {
    fontSize: "18px",
    color: "#111827",
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
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 800,
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  filterActions: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  secondaryButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 800,
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
    verticalAlign: "top",
  },
  badge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  entityId: {
    marginLeft: "6px",
    color: "#6b7280",
    fontSize: "12px",
  },
  smallButton: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "12px",
  },
  detailTd: {
    padding: "0 12px 12px",
    borderBottom: "1px solid #f3f4f6",
    background: "#f9fafb",
  },
  pre: {
    margin: 0,
    padding: "14px",
    borderRadius: "10px",
    background: "#111827",
    color: "#e5e7eb",
    overflowX: "auto",
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
};