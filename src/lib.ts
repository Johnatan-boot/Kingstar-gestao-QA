import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type InventoryItem = {
  id: number;
  fornecedor: string;
  material: string;
  medida: string;
  quantidade: number;
  quantidade_minima: number;
  quantidade_maxima: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type Movement = {
  id: number;
  inventory_id: number;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  status: string;
  solicitacao: string;
  material_name: string;
  material_fornecedor: string;
  created_at: string;
};

export type User = {
  id: number;
  nome: string;
  email: string;
  departamento: string;
  cargo: string;
  status: string;
};
