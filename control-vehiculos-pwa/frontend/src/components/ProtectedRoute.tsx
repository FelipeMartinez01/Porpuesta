import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  allowedRoles?: string[];
  allowedPermissions?: string[];
};

export default function ProtectedRoute({
  allowedRoles,
  allowedPermissions,
}: Props) {
  const { token, user } = useAuth();
  const location = useLocation();

  // No logueado
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 FORZAR CAMBIO DE CONTRASEÑA
  if (user?.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Validación por rol
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Validación por permisos
  if (
    allowedPermissions &&
    user &&
    user.role !== "ADMIN" &&
    !allowedPermissions.some((permission) =>
      (user.permissions ?? []).includes(permission)
    )
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}