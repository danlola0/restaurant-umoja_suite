import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDateTime } from '../../utils/formatters';
import { ChefHat, Plus } from 'lucide-react';

export const KitchenPrepPanel: React.FC = () => {
  const { products, recipeIngredients, ingredients, kitchenPreparations, recordKitchenPreparation } = useRestaurant();
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const recipe = recipeIngredients.filter(item => item.productId === productId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || quantity <= 0) return;
    setSaving(true);
    await recordKitchenPreparation(productId, quantity, notes);
    setSaving(false);
    setNotes('');
  };

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-lg sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-stone-100">
        <ChefHat className="h-4 w-4 text-amber-400" /> Plats préparés (stock)
      </h2>
      <form onSubmit={submit} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_auto]">
        <select value={productId} onChange={event => setProductId(event.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs">
          {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
        <input type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(Number(event.target.value))} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs font-mono" />
        <button disabled={saving} className="flex items-center justify-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950">
          <Plus className="h-3.5 w-3.5" /> Enregistrer
        </button>
        <input value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ingrédients / remarque (optionnel)" className="sm:col-span-3 rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" />
      </form>
      {recipe.length > 0 && (
        <p className="mt-2 text-[11px] text-stone-400">
          Recette par plat : {recipe.map(item => {
            const ingredient = ingredients.find(row => row.id === item.ingredientId);
            return `${item.quantity} ${ingredient?.unit || ''} ${ingredient?.name || ''}`;
          }).join(' · ')}
          {quantity > 1 ? ` · Pour ${quantity} : ${recipe.map(item => {
            const ingredient = ingredients.find(row => row.id === item.ingredientId);
            return `${(item.quantity * quantity).toFixed(3)} ${ingredient?.unit || ''} ${ingredient?.name || ''}`;
          }).join(' · ')}` : ''}
        </p>
      )}
      <div className="mt-3 space-y-1 text-xs">
        {kitchenPreparations.slice(0, 5).map(prep => (
          <div key={prep.id} className="flex justify-between text-stone-300">
            <span>{prep.quantity} × {prep.productName}</span>
            <span className="text-stone-500">{formatDateTime(prep.preparedAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
