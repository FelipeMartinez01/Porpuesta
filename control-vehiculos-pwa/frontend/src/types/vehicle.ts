export type Vehicle = {
  id: number;
  vin: string;
  barcode_id?: string | null;
  color?: string | null;
  brand?: string | null;
  model?: string | null;
  vehicle_year?: number | null;
  carrier_id?: number | null;
  sector_id?: number | null;
  slot_id?: number | null;
  status: string;
  photo_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  carrier_name?: string | null;
  sector_name?: string | null;
};

export type VehicleStatus = "FALTANTE" | "EN_TRANSITO" | "RECEPCIONADO";