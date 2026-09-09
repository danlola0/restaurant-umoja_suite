import React, { useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFC } from '../../utils/formatters';
import { buildProfitSnapshot, periodRange } from '../../utils/profitability';

export const DailyResultStrip: React.FC = () => {
  const { invoices, expenses, orders, products, categories, ingredients, recipeIngredients, kitchenPreparations } = useRestaurant();
  const snapshot = useMemo(
    () => buildProfitSnapshot({
      invoices,
      expenses,
      orders,
      products,
      categories,
      ingredients,
      recipes: recipeIngredients,
      preparations: kitchenPreparations,
      range: periodRange('TODAY'),
    }),
    [invoices, expenses, orders, products, categories, ingredients, recipeIngredients, kitchenPreparations]
  );

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900 p-4 text-xs">
      <h2 className="mb-2 text-sm font-extrabold text-stone-100">Résultat du jour (estimé)</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>Ventes <strong className="block font-mono text-emerald-400">{formatFC(snapshot.sales)}</strong></div>
        <div>Dépenses / charges <strong className="block font-mono text-rose-400">{formatFC(snapshot.operatingSpend)}</strong></div>
        <div>Coût consommé <strong className="block font-mono text-amber-300">{formatFC(snapshot.cogs)}</strong></div>
        <div>Marge brute <strong className={`block font-mono ${snapshot.grossMargin < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatFC(snapshot.grossMargin)}</strong></div>
      </div>
    </section>
  );
};
