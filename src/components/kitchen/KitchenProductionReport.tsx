import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDateOnly, formatDateTime } from '../../utils/formatters';
import { periodRange, preparedProductSales, servedProductSales } from '../../utils/profitability';
import { ClipboardList } from 'lucide-react';

export const KitchenProductionReport: React.FC = () => {
  const { products, kitchenPreparations, orders, ingredients } = useRestaurant();
  const range = periodRange('TODAY');
  const prepared = preparedProductSales(kitchenPreparations, range);
  const served = servedProductSales(orders, range);
  const todayLabel = formatDateOnly(`${range.start.getFullYear()}-${String(range.start.getMonth() + 1).padStart(2, '0')}-${String(range.start.getDate()).padStart(2, '0')}`);

  const rows = products
    .map(product => {
      const prep = prepared.get(product.id) || prepared.get(product.name);
      const used = served.get(product.id) || served.get(product.name);
      const preparedQty = prep?.quantity || 0;
      const usedQty = used?.quantity || 0;
      return {
        product,
        preparedQty,
        usedQty,
        remaining: Math.max(0, preparedQty - usedQty),
      };
    })
    .filter(row => row.preparedQty > 0 || row.usedQty > 0);

  const ingredientRows = ingredients.filter(item => Number(item.stockQty) > 0 || Number(item.minStock) > 0).slice(0, 12);

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-lg sm:p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold text-stone-100">
        <ClipboardList className="h-4 w-4 text-amber-400" /> Rapport de production du jour
      </h2>
      <p className="mb-3 text-[11px] text-stone-400">Date : {todayLabel}. Quantités issues des préparations et commandes déjà enregistrées — pas de double saisie.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="font-mono text-[10px] uppercase text-stone-500">
            <tr>
              <th className="py-2 pr-2">Plat préparé</th>
              <th className="py-2 pr-2">Qté préparée</th>
              <th className="py-2 pr-2">Utilisée / servie</th>
              <th className="py-2">Restant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {rows.map(row => (
              <tr key={row.product.id}>
                <td className="py-2 pr-2 font-semibold text-stone-100">{row.product.name}</td>
                <td className="py-2 pr-2 font-mono text-amber-300">{row.preparedQty}</td>
                <td className="py-2 pr-2 font-mono">{row.usedQty}</td>
                <td className="py-2 font-mono text-emerald-400">{row.remaining}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-stone-500">Aucune préparation enregistrée aujourd’hui.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {ingredientRows.length > 0 && (
        <div className="mt-4 border-t border-stone-800 pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase text-stone-500">Stock restant (ingrédients)</p>
          <div className="space-y-1 text-xs">
            {ingredientRows.map(item => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name}</span>
                <strong className="font-mono text-emerald-400">{item.stockQty} {item.unit}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      {kitchenPreparations.filter(prep => {
        const time = new Date(prep.preparedAt).getTime();
        return time >= range.start.getTime() && time <= range.end.getTime();
      }).slice(0, 8).length > 0 && (
        <div className="mt-3 space-y-1 text-[11px] text-stone-500">
          {kitchenPreparations.filter(prep => {
            const time = new Date(prep.preparedAt).getTime();
            return time >= range.start.getTime() && time <= range.end.getTime();
          }).slice(0, 8).map(prep => (
            <div key={prep.id}>{prep.quantity} × {prep.productName} · {formatDateTime(prep.preparedAt)}</div>
          ))}
        </div>
      )}
    </section>
  );
};
