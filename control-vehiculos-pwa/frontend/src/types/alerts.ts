export type VehicleAlert = {
  vehicle_id: number;
  vin: string;
  status: string;
  brand: string | null;
  model: string | null;
  carrier_name: string | null;
  sector_name: string | null;
  shipment_bl: string | null;
  slot_id: number | null;
  hours_in_current_state: number;
};

export type SlotAlert = {
  slot_id: number;
  slot_code: string;
  sector_id: number | null;
  visual_status: string;
};

export type AlertsResponse = {
  total_alerts: number;
  stuck_transit: VehicleAlert[];
  long_storage: VehicleAlert[];
  direct_pending: VehicleAlert[];
  slot_occupied_without_vehicle: SlotAlert[];
};