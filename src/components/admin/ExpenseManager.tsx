import React, { useMemo, useRef, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Expense } from '../../types';
import { buildProfitSnapshot, periodRange, ReportPeriod } from '../../utils/profitability';
import { formatFC, formatDateOnly, formatDateTime } from '../../utils/formatters';
import { EXPENSE_UNITS, NEW_CATEGORY_VALUE, OPERATING_PARENT, OPERATING_SUBCATEGORIES, PURCHASE_CATEGORIES, SALARY_CATEGORY, isPurchaseCategory, isSalaryCategory } from '../../utils/expenseCatalog';
import { Plus, Edit3, Trash2, TrendingDown, TrendingUp, Printer, X, Download, CalendarClock } from 'lucide-react';

const toLocalDateTimeInput = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const ExpenseManager: React.FC = () => {
  const { expenses, invoices, orders, products, categories, ingredients, recipeIngredients, kitchenPreparations, recordExpense, updateExpense, deleteExpense, addExpenseCategory, currentUser, employees, salaryPayments, payEmployeeSalary } = useRestaurant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [category, setCategory] = useState<string>(PURCHASE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [operatingSub, setOperatingSub] = useState<string>(OPERATING_SUBCATEGORIES[0]);
  const [payingId, setPayingId] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('kg');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDateTime, setExpenseDateTime] = useState(toLocalDateTimeInput());
  const [period, setPeriod] = useState<ReportPeriod>('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const dateTimeInputRef = useRef<HTMLInputElement>(null);

  const range = periodRange(period, customStart, customEnd);
  const snapshot = useMemo(
    () => buildProfitSnapshot({ invoices, expenses, orders, products, categories, ingredients, recipes: recipeIngredients, preparations: kitchenPreparations, range }),
    [invoices, expenses, orders, products, categories, ingredients, recipeIngredients, kitchenPreparations, period, customStart, customEnd]
  );

  const sortedExpenses = [...snapshot.periodExpenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const visibleExpenses = activeCategory === 'ALL' ? sortedExpenses : sortedExpenses.filter(expense => expense.category === activeCategory);
  const groupedTotals = Array.from(
    sortedExpenses.reduce((map, expense) => {
      map.set(expense.category, (map.get(expense.category) || 0) + expense.amount);
      return map;
    }, new Map<string, number>())
  ).map(([name, total]) => ({ name, total }));
  const knownCategoryNames = new Set<string>([...PURCHASE_CATEGORIES, SALARY_CATEGORY, OPERATING_PARENT, ...OPERATING_SUBCATEGORIES]);

  const exportExcel = () => {
    const headers = ['Date', 'Categorie', 'Produit', 'Quantite', 'Unite', 'Montant', 'Fournisseur', 'Description'];
    const rows = visibleExpenses.map(expense => [
      formatDateTime(expense.createdAt) !== '-' ? formatDateTime(expense.createdAt) : formatDateOnly(expense.date),
      expense.category,
      expense.itemName || expense.description,
      expense.quantity || '',
      expense.unit || '',
      expense.amount,
      expense.supplier || '',
      expense.description,
    ]);
    const stockHeaders = ['Ingredient', 'Achete', 'Consomme', 'Reste', 'Unite', 'Cout unitaire'];
    const stockRows = snapshot.stockRows.map(row => [row.name, row.purchased, row.consumed, row.remaining, row.unit, row.unitCost]);
    const summary = [
      ['Ventes', snapshot.sales],
      ['Achats (stock)', snapshot.purchaseSpend],
      ['Cout ingredients consommes', snapshot.cogs],
      ['Charges', snapshot.operatingSpend],
      ['Marge brute', snapshot.grossMargin],
      ['Resultat estime', snapshot.estimatedResult],
      ['Plats vendus', snapshot.dishesSold],
      ['Plats prepares', snapshot.dishesPrepared],
      ['Boissons vendues', snapshot.drinksSold],
    ];
    const table = (title: string, h: string[], body: (string | number)[][]) =>
      `<h2>${title}</h2><table><thead><tr>${h.map(cell => `<th>${cell}</th>`).join('')}</tr></thead><tbody>${body.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/><style>table{border-collapse:collapse;margin-bottom:16px}th,td{border:1px solid #999;padding:4px;font-size:11px}</style></head><body><h1>Cloture Umoja</h1>${table('Synthese', ['Indicateur', 'Valeur'], summary)}${table('Depenses', headers, rows)}${table('Stock estime', stockHeaders, stockRows)}</body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cloture_umoja_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const openCreate = () => {
    setEditingExpense(null);
    setCategory(PURCHASE_CATEGORIES[0]);
    setCustomCategory('');
    setOperatingSub(OPERATING_SUBCATEGORIES[0]);
    setItemName('');
    setQuantity(0);
    setUnit('kg');
    setUnitPrice(0);
    setAmount(0);
    setSupplier('');
    setDescription('');
    setExpenseDateTime(toLocalDateTimeInput());
    setIsModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setCategory(expense.category);
    setItemName(expense.itemName || expense.description);
    setQuantity(expense.quantity || 0);
    setUnit(expense.unit || 'kg');
    setUnitPrice(expense.quantity ? expense.amount / expense.quantity : expense.amount);
    setAmount(expense.amount);
    setSupplier(expense.supplier || '');
    setDescription(expense.description);
    setExpenseDateTime(toLocalDateTimeInput(expense.createdAt || `${expense.date}T12:00`));
    setIsModalOpen(true);
  };

  const handleQtyOrPrice = (nextQty: number, nextPrice: number) => {
    setQuantity(nextQty);
    setUnitPrice(nextPrice);
    if (nextQty > 0 && nextPrice > 0) setAmount(Number((nextQty * nextPrice).toFixed(2)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPurchase = isPurchaseCategory(category === OPERATING_PARENT ? operatingSub : category);
    let resolvedCategory = category === NEW_CATEGORY_VALUE ? customCategory.trim() : category === OPERATING_PARENT ? operatingSub : category;
    if (category === NEW_CATEGORY_VALUE) {
      if (!resolvedCategory) return;
      const saved = await addExpenseCategory(resolvedCategory);
      if (!saved) return;
    }
    if (category === OPERATING_PARENT && !operatingSub) return;
    const designation = isPurchase
      ? (category === 'Viandes' && itemName.trim() && !/viande/i.test(itemName) ? `Viande de ${itemName.trim()}` : itemName.trim())
      : (description.trim() || itemName.trim() || resolvedCategory);
    if (amount <= 0) return;
    if (isPurchase && !itemName.trim()) return;
    const recordedBy = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Gestionnaire Umoja';
    const occurredAt = expenseDateTime ? new Date(expenseDateTime) : new Date();
    const occurredIso = Number.isNaN(occurredAt.getTime()) ? new Date().toISOString() : occurredAt.toISOString();
    const expenseData = {
      date: expenseDateTime.slice(0, 10),
      createdAt: occurredIso,
      service: 'ADMINISTRATION' as const,
      category: resolvedCategory,
      itemName: isPurchase ? designation : undefined,
      quantity: isPurchase && quantity > 0 ? quantity : undefined,
      unit: isPurchase ? unit : undefined,
      amount,
      description: description.trim() || designation,
      paymentMethod: 'ESPECES' as const,
      supplier: supplier.trim() || undefined,
      reference: isPurchase ? unit : undefined,
      recordedBy,
    };
    const ok = editingExpense ? await updateExpense(editingExpense.id, expenseData) : await recordExpense(expenseData);
    if (ok) setIsModalOpen(false);
  };

  const printReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    const rows = visibleExpenses.map(expense => `
      <tr>
        <td>${formatDateTime(expense.createdAt) !== '-' ? formatDateTime(expense.createdAt) : formatDateOnly(expense.date)}</td>
        <td>${expense.category}</td>
        <td>${expense.itemName || expense.description}</td>
        <td>${expense.quantity || '—'} ${expense.unit || ''}</td>
        <td style="text-align:right">${formatFC(expense.amount)}</td>
      </tr>`).join('');
    const stockRows = snapshot.stockRows.map(row => `<tr><td>${row.name}</td><td>${row.purchased} ${row.unit}</td><td>${row.consumed.toFixed(3)} ${row.unit}</td><td>${row.remaining.toFixed(3)} ${row.unit}</td></tr>`).join('');
    reportWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Clôture Umoja</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#1c1917}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}th,td{border:1px solid #a8a29e;padding:6px}th{background:#292524;color:#fff}</style></head><body>
        <h1>UMOJA MALEWA RESTAURANT</h1>
        <p>Clôture : ventes − coût des ingrédients consommés − charges. Un achat n’est pas une perte s’il reste du stock.</p>
        <p>Ventes ${formatFC(snapshot.sales)} · Achats ${formatFC(snapshot.purchaseSpend)} · Consommation ${formatFC(snapshot.cogs)} · Charges ${formatFC(snapshot.operatingSpend)} · Marge brute ${formatFC(snapshot.grossMargin)} · Résultat ${formatFC(snapshot.estimatedResult)}</p>
        <h2>Dépenses</h2>
        <table><thead><tr><th>Date</th><th>Catégorie</th><th>Produit</th><th>Quantité</th><th>Montant</th></tr></thead><tbody>${rows}</tbody></table>
        <h2>Stock estimé</h2>
        <table><thead><tr><th>Ingrédient</th><th>Acheté</th><th>Consommé</th><th>Reste</th></tr></thead><tbody>${stockRows || '<tr><td colspan="4">Aucun mouvement</td></tr>'}</tbody></table>
      </body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100">Dépenses et achats</h2>
          <p className="text-xs text-stone-400">Un achat augmente le stock réel. Les charges (salaires, eau, électricité, transport) ne sont pas du stock.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={printReport} className="flex items-center gap-1.5 rounded-xl bg-stone-800 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-stone-700">
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500">
            <Plus className="w-4 h-4" /> Enregistrer une dépense
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {([['TODAY', 'Quotidien'], ['WEEK', 'Hebdomadaire'], ['MONTH', 'Mensuel'], ['CUSTOM', 'Période']] as const).map(([value, label]) => (
          <button key={value} onClick={() => setPeriod(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${period === value ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400'}`}>{label}</button>
        ))}
      </div>
      {period === 'CUSTOM' && (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" />
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 p-2 text-xs" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Ventes payées</span><div className="mt-1 font-mono text-2xl font-black text-emerald-400">{formatFC(snapshot.sales)}</div></div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Achats (stock)</span><div className="mt-1 font-mono text-2xl font-black text-amber-300">{formatFC(snapshot.purchaseSpend)}</div><p className="mt-1 text-[10px] text-stone-500">Pas une perte automatique</p></div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4"><span className="text-[11px] font-bold uppercase text-stone-400">Coût ingrédients consommés</span><div className="mt-1 font-mono text-2xl font-black text-rose-400">{formatFC(snapshot.cogs)}</div></div>
        <div className={`rounded-2xl border p-4 ${snapshot.estimatedResult < 0 ? 'border-rose-600/50 bg-rose-950/30' : 'border-emerald-600/50 bg-emerald-950/30'}`}>
          <span className="text-[11px] font-bold uppercase text-stone-400">Marge brute / résultat estimé</span>
          <div className={`mt-1 flex items-center gap-2 font-mono text-xl font-black ${snapshot.grossMargin < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{snapshot.grossMargin < 0 ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}{formatFC(snapshot.grossMargin)}</div>
          <p className="mt-1 text-[10px] text-stone-400">Résultat (ventes − conso − charges) : {formatFC(snapshot.estimatedResult)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-xs">
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-3">Plats vendus <strong className="block text-amber-300">{snapshot.dishesSold}</strong></div>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-3">Plats préparés <strong className="block text-amber-300">{snapshot.dishesPrepared}</strong></div>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-3">Boissons vendues <strong className="block text-amber-300">{snapshot.drinksSold}</strong></div>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-3">Charges (loyer, SNEL…) <strong className="block text-rose-300">{formatFC(snapshot.operatingSpend)}</strong></div>
      </div>

      {groupedTotals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory('ALL')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${activeCategory === 'ALL' ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400'}`}>Toutes</button>
          {groupedTotals.map(item => (
            <button key={item.name} onClick={() => setActiveCategory(item.name)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${activeCategory === item.name ? 'bg-amber-500 text-stone-950' : 'bg-stone-900 text-stone-400'}`}>{item.name} · {formatFC(item.total)}</button>
          ))}
        </div>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-stone-800"><h3 className="text-sm font-bold text-stone-100">Historique des dépenses</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Date et heure</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Produit / ingrédient</th>
                <th className="py-3 px-4">Quantité</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {visibleExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-stone-800/40">
                  <td className="py-3 px-4 text-stone-400">{formatDateTime(exp.createdAt) !== '-' ? formatDateTime(exp.createdAt) : formatDateOnly(exp.date)}</td>
                  <td className="py-3 px-4">{exp.category}</td>
                  <td className="py-3 px-4 font-semibold text-stone-100">{exp.itemName || exp.description}</td>
                  <td className="py-3 px-4">{exp.quantity ? `${exp.quantity} ${exp.unit || ''}` : '—'}</td>
                  <td className="py-3 px-4 font-mono font-black text-rose-400">{formatFC(exp.amount)}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(exp)} className="mr-1.5 p-1.5 rounded-lg bg-stone-800 text-stone-300" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (window.confirm('Supprimer cette dépense ?')) deleteExpense(exp.id); }} className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-rose-400" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleExpenses.length === 0 && <p className="py-10 text-center text-sm text-stone-500">Aucune dépense sur cette période.</p>}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSubmit} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-700 bg-stone-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingExpense ? 'Modifier la dépense' : 'Enregistrer un achat / une charge'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-300">Catégorie *</label>
                <select
                  value={category}
                  onChange={e => {
                    const next = e.target.value;
                    setCategory(next);
                    if (!isPurchaseCategory(next === OPERATING_PARENT ? operatingSub : next)) {
                      setQuantity(0);
                      setUnitPrice(0);
                      if (next !== 'Viandes') setItemName('');
                    }
                  }}
                  className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm"
                >
                  <optgroup label="Achats / stock">
                    {PURCHASE_CATEGORIES.map(name => <option key={name} value={name}>{name}</option>)}
                  </optgroup>
                  <option value={SALARY_CATEGORY}>{SALARY_CATEGORY}</option>
                  <option value={OPERATING_PARENT}>{OPERATING_PARENT}</option>
                  {editingExpense && category !== NEW_CATEGORY_VALUE && !knownCategoryNames.has(category) && (
                    <option value={category}>{category}</option>
                  )}
                  <option value={NEW_CATEGORY_VALUE}>+ Nouvelle catégorie / nouveau type…</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-300">Date et heure *</label>
                <div className="relative">
                  <input
                    ref={dateTimeInputRef}
                    required
                    type="datetime-local"
                    step="60"
                    value={expenseDateTime}
                    onChange={e => setExpenseDateTime(e.target.value)}
                    className="umoja-datetime relative w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 pr-12 text-sm text-stone-100"
                  />
                  <button
                    type="button"
                    aria-label="Choisir la date et l’heure"
                    onClick={() => {
                      const input = dateTimeInputRef.current;
                      if (!input) return;
                      if (typeof input.showPicker === 'function') input.showPicker();
                      else input.focus();
                    }}
                    className="absolute right-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-amber-400 text-stone-950 shadow-sm hover:bg-amber-300"
                  >
                    <CalendarClock className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {category === NEW_CATEGORY_VALUE && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-300">Nom de la nouvelle catégorie *</label>
                  <input required value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Ex: Saka-saka, Gésier, Poisson fumé" className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm" />
                </div>
              )}
              {category === OPERATING_PARENT && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-300">Type de charge *</label>
                  <select value={operatingSub} onChange={e => setOperatingSub(e.target.value)} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm">
                    {OPERATING_SUBCATEGORIES.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              )}
              {isSalaryCategory(category) ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-stone-400">Personnel RH — période {expenseDateTime.slice(0, 7)}. Un second paiement le même mois demande confirmation.</p>
                  {employees.filter(emp => emp.statut === 'ACTIF').map(employee => {
                    const period = expenseDateTime.slice(0, 7);
                    const paid = salaryPayments.find(item => item.employeeId === employee.id && item.periodMonth === period && item.status === 'PAYE');
                    return (
                      <div key={employee.id} className="flex items-center justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950 p-3">
                        <div>
                          <p className="text-xs font-bold">{employee.prenom} {employee.nom}</p>
                          <p className="text-[11px] text-stone-500">{employee.poste} · {formatFC(employee.salaireBase || employee.salaire)}</p>
                          {paid && <p className="text-[10px] text-emerald-400">Payé le {paid.paidAt.slice(0, 10)}</p>}
                        </div>
                        <button
                          type="button"
                          disabled={payingId === employee.id}
                          onClick={async () => {
                            const duplicate = Boolean(paid);
                            if (duplicate && !window.confirm(`Salaire déjà payé pour ${period}. Payer à nouveau ?`)) return;
                            setPayingId(employee.id);
                            await payEmployeeSalary(employee.id, period, duplicate, expenseDateTime);
                            setPayingId('');
                          }}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-stone-950 disabled:opacity-50"
                        >
                          Payer le salaire
                        </button>
                      </div>
                    );
                  })}
                  {employees.filter(emp => emp.statut === 'ACTIF').length === 0 && <p className="text-xs text-stone-500">Aucun travailleur actif dans Personnel RH.</p>}
                </div>
              ) : isPurchaseCategory(category) ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-stone-300">{category === 'Viandes' ? 'Type de viande *' : 'Nom de l’article *'}</label>
                    <input required value={itemName} onChange={e => setItemName(e.target.value)} placeholder={category === 'Viandes' ? 'Ex: bœuf, porc, chèvre, poulet' : 'Nom de l’article'} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm" autoComplete="off" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-stone-300">Quantité (entrée stock)</label>
                      <input type="number" min="0" step="0.01" value={quantity || ''} onChange={e => handleQtyOrPrice(Number(e.target.value) || 0, unitPrice)} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-stone-300">Unité</label>
                      <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm">
                        {EXPENSE_UNITS.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-stone-300">Prix d’achat unitaire</label>
                      <input type="number" min="0" step="0.01" value={unitPrice || ''} onChange={e => handleQtyOrPrice(quantity, Number(e.target.value) || 0)} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-stone-300">Montant total *</label>
                      <input required type="number" min="0.01" step="0.01" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm font-mono font-bold text-rose-400" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-stone-300">Fournisseur</label>
                    <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Optionnel" className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-300">Montant *</label>
                  <input required={!isSalaryCategory(category)} type="number" min="0.01" step="0.01" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} placeholder="Ex: 150000" className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm font-mono font-bold text-rose-400" />
                </div>
              )}
              {!isSalaryCategory(category) && (
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-300">Description {isPurchaseCategory(category) ? '' : '(optionnel)'}</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder={isPurchaseCategory(category) ? '' : 'Ex: Facture SNEL'} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm" />
              </div>
              )}
              {isPurchaseCategory(category) && <p className="text-[10px] text-amber-300">Cet achat est une entrée de stock (quantité ajoutée à l’article).</p>}
              {!isSalaryCategory(category) && <button type="submit" className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500">{editingExpense ? 'Enregistrer' : 'Ajouter la dépense'}</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
