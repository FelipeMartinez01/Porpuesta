import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import VehiclesPage from "./pages/VehiclesPage";
import UploadPage from "./pages/UploadPage";
import ReceptionPage from "./pages/ReceptionPage";
import ParkingMapPage from "./pages/ParkingMapPage";

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}