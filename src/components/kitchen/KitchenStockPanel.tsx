import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { stockAlertMessage, stockStatus } from '../../utils/stockStatus';
import { Package } from 'lucide-react';

export const KitchenStockPanel: React.FC = () => {
  const { ingredients, applyStockMovement } = useRestaurant();
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!ingredientId && ingredients[0]) setIngredientId(ingredients[0].id);
  }, [ingredients, ingredientId]);
  const selected = ingredients.find(item => item.id === ingredientId);
  const alerts = ingredients.filter(item => stockAlertMessage(item));

  const consume = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || quantity <= 0) return;
    setSaving(true);
    await applyStockMovement({
      ingredientId: selected.id,
      name: selected.name,
      unit: selected.unit,
      quantity,
      type: 'SORTIE',
      reason: 'Utilisation cuisine',
    });
    setSaving(false);
  };

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-lg sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
        <Package className="h-4 w-4 text-amber-400" /> Stock cuisine
      </h2>
      {alerts.map(item => (
        <p key={item.id} className="mb-2 rounded-lg border border-amber-700/40 bg-amber-950/40 p-2 text-[11px] text-amber-200">{stockAlertMessage(item)}</p>
      ))}
      <div className="mb-3 space-y-1 text-xs">
        {ingredients.slice(0, 8).map(item => {
          const status = stockStatus(item);
          return (
            <div key={item.id} className="flex justify-between">
              <span>{item.name}</span>
              <strong className={status === 'RUPTURE' ? 'text-rose-400' : status === 'FAIBLE' ? 'text-amber-300' : status === 'NON_APPROVISIONNE' ? 'text-stone-400' : 'text-emerald-400'}>
                {item.stockQty} {item.unit} restants
              </strong>
            </div>
          );
        })}
        {ingredients.length === 0 && <p className="text-stone-500">Aucun article en stock.</p>}
      </div>
      <form onSubmit={consume} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_auto]">
        <select value={ingredientId} onChange={event => setIngredientId(event.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs">
          {ingredients.map(item => <option key={item.id} value={item.id}>{item.name} ({item.stockQty} {item.unit})</option>)}
        </select>
        <input type="number" min="0.01" step="0.01" value={quantity} onChange={event => setQuantity(Number(event.target.value))} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs font-mono" />
        <button disabled={saving || !selected} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white">Sortir du stock</button>
      </form>
    </section>
  );
};
