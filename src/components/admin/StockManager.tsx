import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDateTime } from '../../utils/formatters';
import { stockAlertMessage, stockStatus, stockStatusLabel } from '../../utils/stockStatus';
import { Package, AlertTriangle } from 'lucide-react';

export const StockManager: React.FC = () => {
  const { ingredients, stockMovements, updateStockItem } = useRestaurant();
  const [minEdits, setMinEdits] = useState<Record<string, number>>({});

  const alerts = ingredients.map(item => ({ item, message: stockAlertMessage(item) })).filter(row => row.message);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
        <h2 className="flex items-center gap-2 text-base font-extrabold"><Package className="h-4 w-4 text-amber-400" /> Gestion des stocks</h2>
        <p className="mt-1 text-xs text-stone-400">Quantités réelles dans Supabase. Un achat avec quantité dans Dépenses augmente le stock ; une sortie cuisine le diminue.</p>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(row => (
            <div key={row.item.id} className="flex items-start gap-2 rounded-xl border border-amber-600/40 bg-amber-950/30 p-3 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{row.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-stone-950 text-[10px] uppercase text-stone-500">
              <tr>
                <th className="p-3 text-left">Article</th>
                <th className="p-3 text-left">Catégorie</th>
                <th className="p-3 text-right">Stock actuel</th>
                <th className="p-3 text-left">Unité</th>
                <th className="p-3 text-right">Stock min.</th>
                <th className="p-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(item => {
                const status = stockStatus(item);
                return (
                  <tr key={item.id} className="border-t border-stone-800">
                    <td className="p-3 font-semibold">{item.name}</td>
                    <td className="p-3">{item.category || '—'}</td>
                    <td className="p-3 text-right font-mono text-amber-300">{item.stockQty}</td>
                    <td className="p-3">{item.unit}</td>
                    <td className="p-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={minEdits[item.id] ?? item.minStock}
                        onChange={e => setMinEdits(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                        onBlur={() => {
                          const value = minEdits[item.id];
                          if (value !== undefined && value !== item.minStock) void updateStockItem(item.id, { minStock: value });
                        }}
                        className="w-20 rounded border border-stone-700 bg-stone-950 p-1 text-right font-mono"
                      />
                    </td>
                    <td className={`p-3 font-bold ${status === 'RUPTURE' ? 'text-rose-400' : status === 'FAIBLE' ? 'text-amber-400' : status === 'NON_APPROVISIONNE' ? 'text-stone-400' : 'text-emerald-400'}`}>{stockStatusLabel(status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ingredients.length === 0 && <p className="p-8 text-center text-stone-500">Aucun article. Enregistrez un achat avec une quantité dans Dépenses.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
        <h3 className="mb-3 text-sm font-bold">Historique des mouvements</h3>
        <div className="max-h-80 space-y-2 overflow-y-auto text-xs">
          {stockMovements.map(movement => (
            <div key={movement.id} className="flex justify-between gap-3 rounded-lg bg-stone-950/80 p-2">
              <div>
                <span className={movement.movementType === 'ENTREE' ? 'text-emerald-400' : 'text-rose-400'}>{movement.movementType}</span>
                {' · '}{movement.ingredientName} · {movement.quantity} {movement.unit}
                <p className="text-stone-500">{movement.reason}</p>
              </div>
              <span className="shrink-0 text-stone-500">{formatDateTime(movement.createdAt)}</span>
            </div>
          ))}
          {stockMovements.length === 0 && <p className="text-stone-500">Aucun mouvement. Les achats avec quantité dans Dépenses alimentent cet historique.</p>}
        </div>
      </div>
    </div>
  );
};
