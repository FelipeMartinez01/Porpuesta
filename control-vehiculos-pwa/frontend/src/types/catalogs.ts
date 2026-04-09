export type Carrier = {
  id: number;
  name: string;
  rut?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export type Sector = {
  id: number;
  name: string;
  description?: string | null;
};