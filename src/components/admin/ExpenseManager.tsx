import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Expense } from '../../types';
import { formatFC, formatDateOnly } from '../../utils/formatters';
import { Plus, Edit3, Trash2, TrendingDown, TrendingUp, Printer, X } from 'lucide-react';

export const ExpenseManager: React.FC = () => {
  const { expenses, invoices, recordExpense, updateExpense, deleteExpense, currentUser } = useRestaurant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [quantityLabel, setQuantityLabel] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const today = new Date().toISOString().slice(0, 10);
  const sortedExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const totalSales = invoices
    .filter(invoice => invoice.status === 'PAYEE')
    .reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const isGain = netProfit > 0;
  const isLoss = netProfit < 0;
  const marginRate = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  const quantityDisplay = (expense: Expense) => {
    if (expense.reference?.trim()) return expense.reference.trim();
    const designation = expense.itemName || '';
    const desc = (expense.description || '').trim();
    if (desc && desc !== designation) {
      if (designation && desc.startsWith(designation)) {
        return desc.slice(designation.length).replace(/^[·\s,-]+/, '') || '—';
      }
      return desc;
    }
    if (expense.quantity) return String(expense.quantity);
    return '—';
  };

  const openCreate = () => {
    setEditingExpense(null);
    setItemName('');
    setAmount(0);
    setQuantityLabel('');
    setExpenseDate(today);
    setIsModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setItemName(expense.itemName || expense.description);
    setAmount(expense.amount);
    setQuantityLabel(
      expense.reference?.trim()
      || (quantityDisplay(expense) === '—' ? '' : quantityDisplay(expense))
    );
    setExpenseDate(expense.date);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const designation = itemName.trim();
    if (!designation || amount <= 0) return;

    const qtyText = quantityLabel.trim();
    const qtyNumber = qtyText ? Number.parseFloat(qtyText.replace(',', '.')) : undefined;
    const recordedBy = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Gestionnaire Umoja';
    const expenseData = {
      date: expenseDate,
      service: 'ADMINISTRATION' as const,
      category: 'Achats',
      itemName: designation,
      quantity: Number.isFinite(qtyNumber) ? qtyNumber : undefined,
      amount,
      description: designation,
      paymentMethod: 'ESPECES' as const,
      reference: qtyText || undefined,
      recordedBy,
    };

    if (editingExpense) {
      const updated = await updateExpense(editingExpense.id, expenseData);
      if (updated) setIsModalOpen(false);
      return;
    }
    const created = await recordExpense(expenseData);
    if (created) setIsModalOpen(false);
  };

  const printReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    const rows = sortedExpenses.map(expense => `
      <tr>
        <td>${expense.date}</td>
        <td>${expense.itemName || expense.description}</td>
        <td>${quantityDisplay(expense)}</td>
        <td style="text-align:right">${formatFC(expense.amount)}</td>
      </tr>`).join('');
    reportWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Rapport financier</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1c1917; }
        .kpi { display: flex; gap: 12px; margin: 16px 0; }
        .box { flex: 1; border: 1px solid #d6d3d1; padding: 12px; }
        .gain { color: #047857; } .loss { color: #be123c; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #a8a29e; padding: 6px; }
        th { background: #292524; color: #fff; }
      </style></head><body>
        <h1>UMOJA MALEWA RESTAURANT</h1>
        <p>Ventes payées − Achats enregistrés</p>
        <div class="kpi">
          <div class="box">Ventes caisse<br/><strong>${formatFC(totalSales)}</strong></div>
          <div class="box">Dépenses<br/><strong>${formatFC(totalExpenses)}</strong></div>
          <div class="box">${isLoss ? 'Perte' : 'Bénéfice'}<br/><strong class="${isLoss ? 'loss' : 'gain'}">${formatFC(netProfit)}</strong></div>
        </div>
        <table><thead><tr><th>Date</th><th>Libellé</th><th>Quantité</th><th>Montant</th></tr></thead>
        <tbody>${rows}<tr><td colspan="3"><strong>TOTAL DÉPENSES</strong></td><td style="text-align:right"><strong>${formatFC(totalExpenses)}</strong></td></tr></tbody></table>
      </body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100">Gains et pertes</h2>
          <p className="text-xs text-stone-400">Bénéfice net = ventes payées en caisse − toutes les dépenses (achats, loyer, SNEL, etc.).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={printReport} className="flex items-center gap-1.5 rounded-xl bg-stone-800 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-stone-700">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500">
            <Plus className="w-4 h-4" /> Enregistrer une dépense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4">
          <span className="text-[11px] font-bold uppercase text-stone-400">Chiffre d’affaires (ventes payées)</span>
          <div className="mt-1 font-mono text-2xl font-black text-emerald-400">{formatFC(totalSales)}</div>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4">
          <span className="text-[11px] font-bold uppercase text-stone-400">Total dépenses (achats & charges)</span>
          <div className="mt-1 font-mono text-2xl font-black text-rose-400">{formatFC(totalExpenses)}</div>
        </div>
        <div className={`rounded-2xl border p-4 ${isLoss ? 'border-rose-600/50 bg-rose-950/30' : isGain ? 'border-emerald-600/50 bg-emerald-950/30' : 'border-stone-700 bg-stone-900'}`}>
          <span className="text-[11px] font-bold uppercase text-stone-400">{isLoss ? 'Perte nette' : 'Bénéfice net'}</span>
          <div className={`mt-1 flex items-center gap-2 font-mono text-2xl font-black ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isLoss ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
            {formatFC(netProfit)}
          </div>
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isLoss ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {isLoss ? 'Nous perdons de l’argent' : netProfit === 0 ? 'Équilibre : 0' : `Nous gagnons · marge ${marginRate.toFixed(1)} %`}
          </span>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-stone-800">
          <h3 className="text-sm font-bold text-stone-100">Historique des dépenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Libellé / Article</th>
                <th className="py-3 px-4">Quantité</th>
                <th className="py-3 px-4">Montant total dépensé</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {sortedExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-stone-800/40">
                  <td className="py-3 px-4 text-stone-400">{formatDateOnly(exp.date)}</td>
                  <td className="py-3 px-4 font-semibold text-stone-100">{exp.itemName || exp.description}</td>
                  <td className="py-3 px-4">{quantityDisplay(exp)}</td>
                  <td className="py-3 px-4 font-mono font-black text-rose-400">{formatFC(exp.amount)}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(exp)} className="mr-1.5 p-1.5 rounded-lg bg-stone-800 text-stone-300" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (window.confirm('Supprimer cette dépense ?')) deleteExpense(exp.id); }} className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-rose-400" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-950 font-bold">
                <td className="py-3 px-4" colSpan={3}>TOTAL DES DÉPENSES (soustrait des ventes)</td>
                <td className="py-3 px-4 font-mono text-rose-400">{formatFC(totalExpenses)}</td>
                <td />
              </tr>
              <tr className={`font-bold ${isLoss ? 'bg-rose-950/40' : 'bg-emerald-950/40'}`}>
                <td className="py-3 px-4" colSpan={3}>{isLoss ? 'PERTE NETTE' : 'BÉNÉFICE NET'} (ventes − dépenses)</td>
                <td className={`py-3 px-4 font-mono ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>{formatFC(netProfit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
          {sortedExpenses.length === 0 && <p className="py-10 text-center text-sm text-stone-500">Aucune dépense enregistrée.</p>}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingExpense ? 'Modifier la dépense' : 'Enregistrer une dépense / achat'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-300">Désignation / nom de la dépense *</label>
                <input required value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Ex: Loyer, SNEL, électricité, viande, fufu, eau" className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm text-stone-100" />
                <p className="mt-1 text-[10px] text-stone-500">Écrivez simplement le nom : Loyer du mois, Facture SNEL, Électricité, Internet, Eau, Viande…</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-300">Montant dépensé *</label>
                <input required type="number" min={1} step="0.01" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} placeholder="Prix total payé" className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm font-mono font-bold text-rose-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-300">Quantité (optionnel)</label>
                <input value={quantityLabel} onChange={e => setQuantityLabel(e.target.value)} placeholder="Ex: 10 Kg, 1 mois, facture mars (optionnel)" className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm text-stone-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-300">Date *</label>
                <input required type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full rounded-lg border border-stone-700 bg-stone-950 p-2.5 text-sm text-stone-100" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500">
                {editingExpense ? 'Enregistrer' : 'Ajouter la dépense'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
