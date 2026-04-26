export type AlertSeverity = {
  label: "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
  priority: number;
};

export type VehicleAlert = {
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggested_action: string;

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

  missing_fields?: string[];
};

export type SlotAlert = {
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggested_action: string;

  slot_id: number;
  slot_code: string;
  sector_id: number | null;
  visual_status: string;
};

export type AlertsResponse = {
  total_alerts: number;

  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;

  all_alerts: (VehicleAlert | SlotAlert)[];

  stuck_transit: VehicleAlert[];
  long_storage: VehicleAlert[];
  direct_pending: VehicleAlert[];

  missing_bl: VehicleAlert[];
  missing_photo: VehicleAlert[];
  incomplete_data: VehicleAlert[];
  stored_without_slot: VehicleAlert[];

  slot_occupied_without_vehicle: SlotAlert[];
};