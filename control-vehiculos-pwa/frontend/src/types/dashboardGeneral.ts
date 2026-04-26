export type DashboardGeneralSummary = {
  total_vehicles: number;
  reception_percent: number;
  dispatch_percent: number;
  vehicles_in_yard: number;
  average_yard_hours: number;
  yard_occupancy_percent: number;
  total_slots: number;
  occupied_slots: number;
  available_slots: number;
  status_counts: {
    faltante: number;
    directo: number;
    almacenado: number;
    en_transito: number;
    despachado: number;
  };
};