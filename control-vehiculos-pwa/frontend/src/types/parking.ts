export type ParkingSlot = {
  id: number;
  sector_id: number;
  row_num: number;
  col_num: number;
  code: string;
  visual_status: "DISPONIBLE" | "SALIDA" | "OCUPADO";
};

export type SlotVehicleInfo = {
  id: number;
  vin: string;
  status: string;
  carrier_name?: string | null;
  sector_name?: string | null;
  brand?: string | null;
  model?: string | null;
};