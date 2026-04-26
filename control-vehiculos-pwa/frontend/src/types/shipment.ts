export type Vessel = {
  id: number;
  name: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type Voyage = {
  id: number;
  vessel_id: number;
  vessel_name?: string | null;
  voyage_number: string;
  origin?: string | null;
  destination?: string | null;
  arrival_date?: string | null;
  departure_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type Shipment = {
  id: number;
  bl_number: string;
  voyage_id: number;
  vessel_name?: string | null;
  voyage_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type ShipmentDashboard = {
  shipment_id: number;
  bl_number: string;
  vessel_name?: string | null;
  origin?: string | null;
  total_vehicles: number;
  faltante: number;
  en_transito: number;
  recepcionado: number;
};