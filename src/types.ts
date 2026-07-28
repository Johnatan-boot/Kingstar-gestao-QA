export interface InventoryItem {
  id: number;
  supplier: string;
  material: string;
  measurement: string;
  quantity: number;
  request_status: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryStats {
  name: string;
  value: number;
}
