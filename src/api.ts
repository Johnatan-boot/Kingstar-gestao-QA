import { InventoryItem, InventoryStats } from './types';

const API_BASE = '/api/inventory';

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
};

export const fetchStats = async (): Promise<InventoryStats[]> => {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

export const createItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: number }> => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
};

export const updateItem = async (id: number, item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean }> => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
};

export const deleteItem = async (id: number): Promise<{ success: boolean }> => {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return res.json();
};
