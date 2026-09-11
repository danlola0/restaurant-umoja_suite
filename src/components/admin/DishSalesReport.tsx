import React, { useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { buildProfitSnapshot, ingredientPeriodFlow, paidProductSales, periodRange, preparedProductSales, ReportPeriod, servedProductSales } from '../../utils/profitability';
import { formatFC, formatDateOnly } from '../../utils/formatters';
import { RotateCcw, Undo2, Utensils } from 'lucide-react';

const RECETTES_RESET_KEY = 'umoja_recettes_display_reset_at';

export const DishSalesReport: React.FC = () => {
  const { products, invoices, orders, expenses, ingredients, recipeIngredients, kitchenPreparations, categories, stockMovements } = useRestaurant();
  const [period, setPeriod] = useState<ReportPeriod>('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [resetAt, setResetAt] = useState<string | null>(() => {
    try { return localStorage.getItem(RECETTES_RESET_KEY); } catch { return null; }
  });

  const range = useMemo(() => {
    const base = periodRange(period, customStart, customEnd);
    if (!resetAt) return base;
    const reset = new Date(resetAt);
    if (Number.isNaN(reset.getTime())) return base;
    return { start: reset > base.start ? reset : base.start, end: base.end };
  }, [period, customStart, customEnd, resetAt]);
  const snapshot = useMemo(
    () => buildProfitSnapshot({ invoices, expenses, orders, products, categories, ingredients, recipes: recipeIngredients, preparations: kitchenPreparations, range, stockRange: range }),
    [invoices, expenses, orders, products, categories, ingredients, recipeIngredients, kitchenPreparations, range]
  );
  const salesMap = useMemo(() => paidProductSales(invoices, orders, range), [invoices, orders, range]);
  const servedMap = useMemo(() => servedProductSales(orders, range), [orders, range]);
  const preparedMap = useMemo(() => preparedProductSales(kitchenPreparations, range), [kitchenPreparations, range]);
  const stockFlow = useMemo(
    () => ingredientPeriodFlow(ingredients, stockMovements, expenses, range, { resetCycle: Boolean(resetAt) }),
    [ingredients, stockMovements, expenses, range, resetAt]
  );

  const dishRows = useMemo(() => {
    return products
      .map(product => {
        const sold = salesMap.get(product.id) || salesMap.get(product.name) || { quantity: 0, revenue: 0 };
        const served = servedMap.get(product.id) || servedMap.get(product.name);
        const prepared = preparedMap.get(product.id) || preparedMap.get(product.name);
        const preparedQty = prepared?.quantity || 0;
        const servedQty = served?.quantity || 0;
        const soldQty = sold.quantity;
        const remaining = preparedQty > 0 ? Math.max(0, preparedQty - servedQty) : 0;
        const gap = preparedQty > 0 && Math.abs(preparedQty - servedQty) > 0.001;
        return { product, preparedQty, servedQty, soldQty, remaining, revenue: sold.revenue, gap };
      })
      .filter(row => row.product.available || row.soldQty > 0 || row.preparedQty > 0 || row.servedQty > 0)
      .sort((left, right) => right.revenue - left.revenue || left.product.name.localeCompare(right.product.name, 'fr'));
  }, [products, salesMap, servedMap, preparedMap]);

  const preparedTotal = dishRows.reduce((sum, row) => sum + row.preparedQty, 0);
  const servedTotal = dishRows.reduce((sum, row) => sum + row.servedQty, 0);
  const soldTotal = dishRows.reduce((sum, row) => sum + row.soldQty, 0);
  const remainingDishes = dishRows.reduce((sum, row) => sum + row.remaining, 0);
  const remainingStockValue = stockFlow.reduce((sum, row) => sum + row.remainingValue, 0);
  const stockGaps = stockFlow.filter(row => Math.abs(row.variance) > 0.05);
  const dishGaps = dishRows.filter(row => row.gap);
  const periodStart = `${range.start.getFullYear()}-${String(range.start.getMonth() + 1).padStart(2, '0')}-${String(range.start.getDate()).padStart(2, '0')}`;
  const periodEnd = `${range.end.getFullYear()}-${String(range.end.getMonth() + 1).padStart(2, '0')}-${String(range.end.getDate()).padStart(2, '0')}`;
  const periodLabel = period === 'TODAY' ? `Journée du ${formatDateOnly(periodStart)}` : `${formatDateOnly(periodStart)} → ${formatDateOnly(periodEnd)}`;
  const estimatedResult = snapshot.sales - snapshot.totalExpenses;

  const resetDisplay = () => {
    if (!window.confirm('Réinitialiser Recettes ? Les totaux et le stock affichés ici partent à zéro. L’historique n’est pas supprimé.')) return;
    const now = new Date().toISOString();
    try { localStorage.setItem(RECETTES_RESET_KEY, now); } catch { /* ignore */ }
    setResetAt(now);
    setPeriod('TODAY');
  };

  const restoreDisplay = () => {
    try { localStorage.removeItem(RECETTES_RESET_KEY); } catch { /* ignore */ }
    setResetAt(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold text-stone-100">
              <Utensils className="h-4 w-4 text-amber-400" /> Recettes — vue générale
            </h2>
            <p className="mt-1 text-xs text-stone-400">{periodLabel}. Données : achats, stock, préparations, service, ventes payées (Supabase).</p>
            {resetAt && <p className="mt-1 text-[11px] text-amber-300">Affichage et stock Recettes à zéro depuis {formatDateOnly(resetAt)}. L’historique n’a pas été supprimé.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetDisplay} className="inline-flex items-center gap-1.5 rounded-xl bg-stone-800 px-3 py-2 text-xs font-bold text-stone-100 hover:bg-stone-700">
              <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
            </button>
            {resetAt && (
              <button type="button" onClick={restoreDisplay} className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 px-3 py-2 text-xs font-bold text-stone-300 hover:bg-stone-800">
                <Undo2 className="h-3.5 w-3.5" /> Restaurer l’affichage
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {([['TODAY', 'Journalier'], ['WEEK', 'Hebdomadaire'], ['MONTH', 'Mensuel'], ['CUSTOM', 'Période personnalisée']] as const).map(([value, label]) => (
          <button key={value} onClick={() => setPeriod(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${period === value ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400'}`}>{label}</button>
        ))}
      </div>
      {period === 'CUSTOM' && (
        <div className="grid max-w-md grid-cols-2 gap-3">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" />
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" />
        </div>
      )}

      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4 text-xs text-stone-300">
        <p className="font-bold text-stone-100">Chaîne de la période</p>
        <p className="mt-2 font-mono text-[11px] text-amber-200">Stock initial + Achats / entrées − Préparations / consommations − Ventes / sorties = Stock restant</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>Cuisine préparée <strong className="block text-amber-300">{preparedTotal}</strong></div>
          <div>Serveur / servis <strong className="block text-amber-300">{servedTotal}</strong></div>
          <div>Ventes payées <strong className="block text-emerald-400">{soldTotal}</strong></div>
          <div>Restant (préparé − servi) <strong className="block text-stone-100">{remainingDishes}</strong></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Recettes / ventes</span><div className="mt-1 font-mono text-xl font-black text-emerald-400">{formatFC(snapshot.sales)}</div></div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Montant encaissé</span><div className="mt-1 font-mono text-xl font-black text-emerald-300">{formatFC(snapshot.sales)}</div></div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Total des dépenses</span><div className="mt-1 font-mono text-xl font-black text-rose-400">{formatFC(snapshot.totalExpenses)}</div></div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Total des achats</span><div className="mt-1 font-mono text-xl font-black text-amber-300">{formatFC(snapshot.purchaseSpend)}</div></div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Valeur stock restant</span><div className="mt-1 font-mono text-xl font-black text-stone-100">{formatFC(remainingStockValue)}</div></div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Résultat estimé</span><div className={`mt-1 font-mono text-xl font-black ${estimatedResult < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatFC(estimatedResult)}</div><p className="mt-1 text-[10px] text-stone-500">Ventes − dépenses de la période (estimation)</p></div>
      </div>

      {(stockGaps.length > 0 || dishGaps.length > 0) && (
        <div className="rounded-2xl border border-amber-700/50 bg-amber-950/30 p-4 text-xs text-amber-100">
          <p className="font-bold">Écart de stock à vérifier</p>
          <p className="mt-1 text-amber-200/80">Ce n’est pas une perte certaine. Les quantités préparées, servies et le stock réel ne correspondent pas parfaitement.</p>
          {dishGaps.slice(0, 6).map(row => (
            <p key={row.product.id} className="mt-1">{row.product.name} : préparé {row.preparedQty} · servi {row.servedQty} · vendu {row.soldQty}</p>
          ))}
          {stockGaps.slice(0, 6).map(row => (
            <p key={row.id} className="mt-1">{row.name} : restant {row.remaining} {row.unit} · théorique {Math.max(0, row.theoreticalRemaining).toFixed(3)} {row.unit}</p>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-xl">
        <div className="px-4 py-3 text-sm font-bold">Plats (carte Client)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950 font-mono text-[10px] uppercase text-stone-400">
              <tr>
                <th className="px-4 py-3">Plat</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Préparé</th>
                <th className="px-4 py-3">Servi</th>
                <th className="px-4 py-3">Vendu</th>
                <th className="px-4 py-3">Restant</th>
                <th className="px-4 py-3 text-right">Total ventes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {dishRows.map(row => (
                <tr key={row.product.id} className="hover:bg-stone-800/40">
                  <td className="px-4 py-3 font-semibold text-stone-100">{row.product.name}</td>
                  <td className="px-4 py-3 font-mono">{formatFC(row.product.price)}</td>
                  <td className="px-4 py-3 font-mono">{row.preparedQty}</td>
                  <td className="px-4 py-3 font-mono">{row.servedQty}</td>
                  <td className="px-4 py-3 font-mono text-amber-300">{row.soldQty}</td>
                  <td className="px-4 py-3 font-mono">{row.remaining}</td>
                  <td className="px-4 py-3 text-right font-mono font-black text-emerald-400">{formatFC(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-950 font-bold">
                <td className="px-4 py-3" colSpan={2}>Total</td>
                <td className="px-4 py-3 font-mono">{preparedTotal}</td>
                <td className="px-4 py-3 font-mono">{servedTotal}</td>
                <td className="px-4 py-3 font-mono">{soldTotal}</td>
                <td className="px-4 py-3 font-mono">{remainingDishes}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatFC(snapshot.sales)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-xl">
        <div className="px-4 py-3 text-sm font-bold">Stock (ingrédients)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950 font-mono text-[10px] uppercase text-stone-400">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Initial estimé</th>
                <th className="px-4 py-3">Achats / entrées</th>
                <th className="px-4 py-3">Sorties</th>
                <th className="px-4 py-3">Restant</th>
                <th className="px-4 py-3 text-right">Valeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {stockFlow.map(row => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold">{row.name}</td>
                  <td className="px-4 py-3 font-mono">{row.initial} {row.unit}</td>
                  <td className="px-4 py-3 font-mono">{row.purchased} {row.unit}</td>
                  <td className="px-4 py-3 font-mono">{row.consumed} {row.unit}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400">{row.remaining} {row.unit}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatFC(row.remainingValue)}</td>
                </tr>
              ))}
              {stockFlow.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-500">Aucun mouvement de stock sur cette période.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
