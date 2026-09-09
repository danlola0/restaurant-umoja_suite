import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFC } from '../../utils/formatters';
import { BarChart3, Plus, Trash2 } from 'lucide-react';

type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

const startForPeriod = (period: Period, customStart: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (period === 'TODAY') return today;
  if (period === 'WEEK') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return start;
  }
  if (period === 'MONTH') {
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    return start;
  }
  return customStart ? new Date(`${customStart}T00:00:00`) : today;
};

export const RecipeProfitability: React.FC = () => {
  const { products, orders, ingredients, recipeIngredients, addIngredient, setRecipeIngredient, removeRecipeIngredient } = useRestaurant();
  const [period, setPeriod] = useState<Period>('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('kg');
  const [ingredientCost, setIngredientCost] = useState<number | ''>('');
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [recipeQuantity, setRecipeQuantity] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedRecipe = recipeIngredients.filter(item => item.productId === selectedProductId);
  const selectedProduct = products.find(product => product.id === selectedProductId);
  const costPerPortion = (productId: string) => recipeIngredients
    .filter(item => item.productId === productId)
    .reduce((total, item) => total + item.quantity * (ingredients.find(ingredient => ingredient.id === item.ingredientId)?.unitCost || 0), 0);

  const start = startForPeriod(period, customStart);
  const end = period === 'CUSTOM' && customEnd ? new Date(`${customEnd}T23:59:59`) : new Date();
  const sales = new Map<string, { quantity: number; revenue: number }>();
  orders.filter(order => order.status !== 'ANNULEE' && new Date(order.createdAt) >= start && new Date(order.createdAt) <= end).forEach(order => {
    order.items.forEach(item => {
      const existing = sales.get(item.productId) || { quantity: 0, revenue: 0 };
      sales.set(item.productId, { quantity: existing.quantity + item.quantity, revenue: existing.revenue + item.subtotal });
    });
  });
  const profitability = products.map(product => {
    const sale = sales.get(product.id) || { quantity: 0, revenue: 0 };
    const recipeLines = recipeIngredients.filter(item => item.productId === product.id);
    const hasRecipe = recipeLines.length > 0;
    const portionCost = costPerPortion(product.id);
    const ingredientCost = portionCost * sale.quantity;
    const costKnown = hasRecipe && portionCost > 0;
    return { product, ...sale, portionCost, ingredientCost, grossProfit: sale.revenue - ingredientCost, hasRecipe, costKnown };
  }).filter(item => item.quantity > 0 || recipeIngredients.some(recipe => recipe.productId === item.product.id))
    .sort((left, right) => right.revenue - left.revenue);

  const addNewIngredient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ingredientName.trim() || ingredientCost === '') return;
    setIsSaving(true);
    const created = await addIngredient(ingredientName, ingredientUnit, ingredientCost);
    setIsSaving(false);
    if (created) {
      setIngredientName('');
      setIngredientCost('');
    }
  };

  const addToRecipe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProductId || !selectedIngredientId || recipeQuantity === '') return;
    setIsSaving(true);
    const saved = await setRecipeIngredient(selectedProductId, selectedIngredientId, recipeQuantity);
    setIsSaving(false);
    if (saved) setRecipeQuantity('');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-xl">
        <div className="flex flex-col gap-3 border-b border-stone-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="flex items-center gap-2 text-sm font-bold text-stone-100"><BarChart3 className="h-4 w-4 text-amber-400" /> Rentabilité des recettes</h3><p className="text-xs text-stone-400">Bénéfice = prix de vente − coût d’achat des ingrédients de la recette. Sans recette, le coût reste à 0 et le bénéfice n’est pas calculable.</p></div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-stone-950 p-1">{([['TODAY', "Aujourd'hui"], ['WEEK', 'Cette semaine'], ['MONTH', 'Ce mois'], ['CUSTOM', 'Personnalisée']] as const).map(([value, label]) => <button key={value} onClick={() => setPeriod(value)} className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${period === value ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'}`}>{label}</button>)}</div>
        </div>
        {period === 'CUSTOM' && <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><input type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" /><input type="date" value={customEnd} onChange={event => setCustomEnd(event.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" /></div>}
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="border-b border-stone-800 text-[10px] uppercase text-stone-500"><tr><th className="p-3">Plat</th><th className="p-3 text-right">Portions</th><th className="p-3 text-right">Coût / portion</th><th className="p-3 text-right">Montant vendu</th><th className="p-3 text-right">Coût ingrédients</th><th className="p-3 text-right">Bénéfice brut</th></tr></thead><tbody className="divide-y divide-stone-800">{profitability.map(item => <tr key={item.product.id}><td className="p-3 font-bold text-stone-200">{item.product.name}{!item.costKnown && <span className="mt-0.5 block text-[10px] font-medium text-amber-400/90">Recette ou coût d’achat manquant</span>}</td><td className="p-3 text-right font-mono">{item.quantity}</td><td className="p-3 text-right font-mono">{item.costKnown ? formatFC(item.portionCost) : '—'}</td><td className="p-3 text-right font-mono text-emerald-400">{formatFC(item.revenue)}</td><td className="p-3 text-right font-mono text-rose-400">{item.costKnown ? formatFC(item.ingredientCost) : '—'}</td><td className={`p-3 text-right font-mono font-bold ${!item.costKnown ? 'text-stone-500' : item.grossProfit >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>{item.costKnown ? formatFC(item.grossProfit) : 'Non calculable'}</td></tr>)}{profitability.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-stone-500">Ajoutez les ingrédients d’une recette ou attendez les premières ventes enregistrées.</td></tr>}</tbody></table></div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-xl">
          <h3 className="mb-4 text-sm font-bold text-stone-100">Coût des ingrédients</h3>
          <form onSubmit={addNewIngredient} className="grid grid-cols-1 gap-2 sm:grid-cols-3"><input required value={ingredientName} onChange={event => setIngredientName(event.target.value)} placeholder="Ingrédient" className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" /><input required value={ingredientUnit} onChange={event => setIngredientUnit(event.target.value)} placeholder="Unité" className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" /><input required type="number" min="0" step="0.01" value={ingredientCost} onChange={event => setIngredientCost(event.target.value ? Number(event.target.value) : '')} placeholder="Coût / unité" className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" /><button disabled={isSaving} className="sm:col-span-3 flex items-center justify-center gap-2 rounded-xl bg-stone-800 px-3 py-2 text-xs font-bold hover:bg-stone-700"><Plus className="h-3.5 w-3.5" /> Ajouter l’ingrédient</button></form>
          <div className="mt-4 max-h-48 space-y-1 overflow-y-auto text-xs">{ingredients.map(ingredient => <div key={ingredient.id} className="flex justify-between rounded-lg bg-stone-950/70 px-3 py-2"><span>{ingredient.name} <span className="text-stone-500">/ {ingredient.unit}</span></span><strong className="font-mono text-amber-400">{formatFC(ingredient.unitCost)}</strong></div>)}</div>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-xl">
          <h3 className="mb-4 text-sm font-bold text-stone-100">Composition d’une recette</h3>
          <select value={selectedProductId} onChange={event => setSelectedProductId(event.target.value)} className="mb-3 w-full rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs">{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
          <form onSubmit={addToRecipe} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px]"><select required value={selectedIngredientId} onChange={event => setSelectedIngredientId(event.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs"><option value="">Choisir un ingrédient</option>{ingredients.map(ingredient => <option key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.unit})</option>)}</select><input required type="number" min="0.001" step="0.001" value={recipeQuantity} onChange={event => setRecipeQuantity(event.target.value ? Number(event.target.value) : '')} placeholder="Qté" className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" /><button disabled={isSaving} className="sm:col-span-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950"><Plus className="inline h-3.5 w-3.5" /> Ajouter à la recette</button></form>
          <div className="mt-4 space-y-1 text-xs">{selectedRecipe.map(recipe => { const ingredient = ingredients.find(item => item.id === recipe.ingredientId); return <div key={recipe.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-950/70 px-3 py-2"><span>{ingredient?.name || 'Ingrédient'}: {recipe.quantity} {ingredient?.unit}</span><div className="flex items-center gap-2"><strong className="font-mono text-amber-400">{formatFC(recipe.quantity * (ingredient?.unitCost || 0))}</strong><button onClick={() => void removeRecipeIngredient(recipe.id)} title="Retirer" className="text-stone-500 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button></div></div>; })}{selectedProduct && <p className="border-t border-stone-800 pt-3 text-right font-bold text-stone-300">Coût estimatif / portion : <span className="font-mono text-amber-400">{formatFC(costPerPortion(selectedProduct.id))}</span></p>}</div>
        </div>
      </div>
    </div>
  );
};
