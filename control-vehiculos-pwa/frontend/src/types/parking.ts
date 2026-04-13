export type ParkingSlot = {
  id: number;
  sector_id: number;
  row_num: number;
  col_num: number;
  code: string;
  visual_status: "DISPONIBLE" | "SALIDA" | "OCUPADO";
};