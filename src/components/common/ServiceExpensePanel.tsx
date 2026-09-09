import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { PaymentMethod } from '../../types';
import { formatFC } from '../../utils/formatters';
import { EXPENSE_CATEGORY_OPTIONS, OPERATING_PARENT, OPERATING_SUBCATEGORIES, PURCHASE_CATEGORIES, SALARY_CATEGORY, isPurchaseCategory } from '../../utils/expenseCatalog';
import { Plus, ReceiptText, X } from 'lucide-react';

interface ServiceExpensePanelProps {
  service: 'CUISINE' | 'CAISSE';
  title: string;
}

export const ServiceExpensePanel: React.FC<ServiceExpensePanelProps> = ({ service, title }) => {
  const { expenses, expenseCategories, currentUser, recordExpense } = useRestaurant();
  const categoryOptions = expenseCategories.length > 0
    ? expenseCategories.map(item => item.name)
    : [...EXPENSE_CATEGORY_OPTIONS];
  const purchaseNames = categoryOptions.filter(name => isPurchaseCategory(name));
  const chargeNames = categoryOptions.filter(name => !isPurchaseCategory(name));
  const [category, setCategory] = useState(categoryOptions[0]);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const serviceExpenses = expenses.filter(expense => expense.service === service);
  const totalToday = serviceExpenses
    .filter(expense => expense.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const submitExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (amount <= 0) return;
    if (isPurchaseCategory(category) && !description.trim()) return;
    setError('');
    setIsSubmitting(true);
    const created = await recordExpense({
      date: new Date().toISOString().slice(0, 10),
      service,
      category,
      itemName: isPurchaseCategory(category) ? description.trim() : undefined,
      amount,
      description: description.trim() || category,
      paymentMethod,
      recordedBy: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur autorisé',
    });
    setIsSubmitting(false);
    if (!created) {
      setError('La dépense n’a pas été enregistrée. Vérifiez votre connexion et vos autorisations.');
      return;
    }
    setAmount(0);
    setDescription('');
    setIsOpen(false);
  };

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-lg sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-stone-100"><ReceiptText className="h-4 w-4 text-rose-400" /> Dépenses journalières - {title}</h2>
          <p className="mt-1 text-xs text-stone-400">Aujourd’hui : <strong className="font-mono text-rose-400">{formatFC(totalToday)}</strong></p>
        </div>
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-500">
          <Plus className="h-4 w-4" /> Enregistrer une dépense
        </button>
      </div>

      {serviceExpenses.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-stone-800 pt-3">
          {serviceExpenses.slice(0, 4).map(expense => (
            <div key={expense.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0"><p className="truncate font-semibold text-stone-200">{expense.description}</p><p className="text-[11px] text-stone-500">{expense.category}</p></div>
              <strong className="shrink-0 font-mono text-rose-400">{formatFC(expense.amount)}</strong>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form onSubmit={submitExpense} className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold">Nouvelle dépense - {title}</h3><button type="button" onClick={() => setIsOpen(false)} className="p-1 text-stone-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-stone-300">Catégorie</label>
                <select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-xs text-stone-100">
                  {(purchaseNames.length ? purchaseNames : [...PURCHASE_CATEGORIES]).length > 0 && (
                    <optgroup label="Achats">
                      {(purchaseNames.length ? purchaseNames : [...PURCHASE_CATEGORIES]).map(name => <option key={name} value={name}>{name}</option>)}
                    </optgroup>
                  )}
                  <optgroup label="Charges du service">
                    {(chargeNames.length ? chargeNames : [SALARY_CATEGORY, OPERATING_PARENT, ...OPERATING_SUBCATEGORIES]).map(name => <option key={name} value={name}>{name}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-stone-300">Montant *</label>
                <input required type="number" min="1" value={amount || ''} onChange={event => setAmount(Number(event.target.value))} placeholder="Montant" className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm font-mono text-stone-100" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-stone-300">{isPurchaseCategory(category) ? 'Produit / motif *' : 'Motif (optionnel)'}</label>
                <textarea required={isPurchaseCategory(category)} rows={2} value={description} onChange={event => setDescription(event.target.value)} placeholder={isPurchaseCategory(category) ? 'Ex: Huile 2 litres' : 'Ex: Taxi marché'} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-xs text-stone-100" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-stone-300">Mode de paiement</label>
                <select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-xs text-stone-100"><option value="ESPECES">Cash / 现金</option><option value="WECHAT">WeChat</option><option value="ALIPAY">Alipay</option><option value="CARTE">UnionPay / Card</option><option value="BANQUE">Bank</option></select>
              </div>
              {error && <p className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-2 text-xs text-rose-200">{error}</p>}
              <button disabled={isSubmitting} type="submit" className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isSubmitting ? 'Enregistrement...' : 'Confirmer la dépense'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
