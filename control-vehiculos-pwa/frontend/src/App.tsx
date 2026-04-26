import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="/parking-map" element={<ParkingMapPage />} />
          <Route path="/vehicles/:vehicleId/history" element={<VehicleHistoryPage />} />
          <Route path="/shipments-dashboard" element={<ShipmentDashboardPage />} />
          <Route path="/shipments/:shipmentId" element={<ShipmentDetailPage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
          <Route path="/carriers" element={<CarriersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}