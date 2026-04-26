import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  allowedRoles?: string[];
};

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { token, user } = useAuth();

  // 🔐 no autenticado
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 validación por rol
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}