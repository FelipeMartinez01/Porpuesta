import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import LoginPage from "./pages/LoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DashboardPage from "./pages/DashboardPage";
import VehiclesPage from "./pages/VehiclesPage";
import UploadPage from "./pages/UploadPage";
import ReceptionPage from "./pages/ReceptionPage";
import ParkingMapPage from "./pages/ParkingMapPage";
import VehicleHistoryPage from "./pages/VehicleHistoryPage";
import ShipmentDashboardPage from "./pages/ShipmentDashboardPage";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import LogisticsPage from "./pages/LogisticsPage";
import CarriersPage from "./pages/CarriersPage";
import DirectDispatchPage from "./pages/DirectDispatchPage";
import YardDispatchPage from "./pages/YardDispatchPage";
import AlertsPage from "./pages/AlertsPage";
import DashboardGeneralPage from "./pages/DashboardGeneralPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLICO */}
          <Route path="/login" element={<LoginPage />} />

          {/* BASE: requiere login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />

            <Route element={<AppLayout />}>
              {/* ACCESO GENERAL */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/vehicles/:vehicleId/history" element={<VehicleHistoryPage />} />
              <Route path="/shipments/:shipmentId" element={<ShipmentDetailPage />} />

              {/* DASHBOARDS POR PERMISO */}
              <Route
                element={
                  <ProtectedRoute allowedPermissions={["DASHBOARD_GENERAL"]} />
                }
              >
                <Route path="/dashboard-general" element={<DashboardGeneralPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute allowedPermissions={["DASHBOARD_BL"]} />
                }
              >
                <Route path="/shipments-dashboard" element={<ShipmentDashboardPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute allowedPermissions={["ALERTAS"]} />
                }
              >
                <Route path="/alerts" element={<AlertsPage />} />
              </Route>

              {/* OPERACIÓN */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["OPERADOR", "SUPERVISOR", "ADMIN"]}
                  />
                }
              >
                <Route path="/reception" element={<ReceptionPage />} />
                <Route path="/parking-map" element={<ParkingMapPage />} />
                <Route path="/dispatch-direct" element={<DirectDispatchPage />} />
                <Route path="/dispatch-yard" element={<YardDispatchPage />} />
              </Route>

              {/* DOCUMENTACIÓN */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["CONTROL_DOCUMENTO", "ADMIN"]}
                  />
                }
              >
                <Route path="/upload" element={<UploadPage />} />
              </Route>

              {/* SUPERVISIÓN */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["SUPERVISOR", "ADMIN"]} />
                }
              >
                <Route path="/logistics" element={<LogisticsPage />} />
              </Route>

              {/* ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/carriers" element={<CarriersPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}