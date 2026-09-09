import { Ingredient } from '../types';

export type StockStatus = 'DISPONIBLE' | 'FAIBLE' | 'RUPTURE' | 'NON_APPROVISIONNE';

export function stockStatus(item: Pick<Ingredient, 'stockQty' | 'minStock'>): StockStatus {
  const qty = Number(item.stockQty || 0);
  const min = Number(item.minStock || 0);
  if (qty <= 0) return min > 0 ? 'RUPTURE' : 'NON_APPROVISIONNE';
  if (min > 0 && qty <= min) return 'FAIBLE';
  return 'DISPONIBLE';
}

export function stockStatusLabel(status: StockStatus): string {
  if (status === 'RUPTURE') return 'Rupture de stock';
  if (status === 'FAIBLE') return 'Stock faible';
  if (status === 'NON_APPROVISIONNE') return 'Pas encore d’entrée';
  return 'Stock disponible';
}

export function stockAlertMessage(item: Ingredient): string | null {
  const status = stockStatus(item);
  if (status === 'RUPTURE') return `Rupture de stock — réapprovisionnement nécessaire (${item.name}).`;
  if (status === 'FAIBLE') return `Stock faible — veuillez réapprovisionner ${item.name} (${item.stockQty} ${item.unit} / min. ${item.minStock}).`;
  return null;
}
