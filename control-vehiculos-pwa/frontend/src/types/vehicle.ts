export type Vehicle = {
  id: number;
  vin: string;

  bl?: string | null;
  barcode_id?: string | null;

  shipment_id?: number | null;
  shipment_bl?: string | null;
  vessel_name?: string | null;
  voyage_number?: string | null;

  color?: string | null;
  brand?: string | null;
  model?: string | null;
  vehicle_year?: number | null;

  carrier_id?: number | null;
  sector_id?: number | null;
  slot_id?: number | null;

  // Ubicación legible
  slot_code?: string | null;
  location_label?: string | null;

  status: string;
  photo_url?: string | null;
  notes?: string | null;

  created_at?: string;
  updated_at?: string;

  carrier_name?: string | null;
  sector_name?: string | null;
};

export type VehicleStatus =
  | "FALTANTE"
  | "DIRECTO"
  | "ALMACENADO"
  | "EN_TRANSITO"
  | "DESPACHADO"
  | "RECEPCIONADO";