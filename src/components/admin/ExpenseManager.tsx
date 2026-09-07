import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { formatFC, formatDateOnly, formatDateTime } from '../../utils/formatters';
import { 
  DollarSign, 
  Plus, 
  Edit3,
  Trash2, 
  TrendingDown, 
  FileText, 
  Building, 
  CreditCard, 
  X, 
  CheckCircle2, 
  Tag 
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Viande', 'Poisson', 'Poulet / Cuisses', 'Riz et semoule', 'Chikwangue', 'Légumes', 'Épices', 'Huile',
  'Boissons', 'Loyer', 'Entretien', 'Transport', 'Électricité', 'Eau', 'Ingrédients', 'Divers', 'Autres dépenses',
];

const EXPENSE_SUBCATEGORIES: Record<string, string[]> = {
  'Légumes': ['Tomate', 'Oignon', 'Poivron', 'Carotte', 'Chou', 'Aubergine', 'Piment', 'Pomme de terre', 'Gombo', 'Autres légumes'],
  'Viande': ['Poulet', 'Bœuf', 'Porc', 'Chèvre', 'Canard', 'Poisson fumé', 'Autre viande'],
  'Fufu / Farine': ['Farine de manioc', 'Farine de maïs', 'Farine mixte', 'Riz à fufu', 'Autre farine'],
  'Riz': ['Riz blanc', 'Riz parfumé', 'Riz étuvé', 'Autre riz'],
  'Poisson': ['Poisson frais', 'Capitaine', 'Carpe', 'Tilapia', 'Poisson fumé', 'Autre poisson'],
  'Épices et condiments': ['Sel', 'Poivre', 'Épices variées', 'Cube / assaisonnement', 'Huile', 'Ail', 'Gingembre', 'Bouillon', 'Autres condiments'],
  'Boissons': ['Eau minérale', 'Sodas', 'Jus', 'Bières', 'Vins', 'Autres boissons'],
  'Ingrédients': ['Ingrédient principal', 'Ingrédient d\'appoint', 'Ingrédient de garniture', 'Autre ingrédient'],
  'Autres achats alimentaires': ['Petit matériel de cuisine', 'Emballages', 'Produits secs', 'Autre achat alimentaire'],
  'Loyer': ['Loyer mensuel', 'Charges locatives', 'Caution', 'Autre frais de loyer'],
  'Entretien': ['Nettoyage', 'Réparation matériel', 'Maintenance cuisine', 'Autre entretien'],
  'Transport': ['Course fournisseur', 'Livraison', 'Carburant', 'Autre transport'],
  'Électricité': ['Facture SNEL', 'Carburant groupe', 'Autre frais électrique'],
  'Eau': ['Facture REGIDESO', 'Forage', 'Autre frais d\'eau'],
  'Autres dépenses': ['Dépense imprévue', 'Frais divers', 'Autre dépense'],
};

export const ExpenseManager: React.FC = () => {
  const { expenses, invoices, expenseCategories, recordExpense, updateExpense, deleteExpense, currentUser } = useRestaurant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [analysisPeriod, setAnalysisPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [subCategory, setSubCategory] = useState(EXPENSE_SUBCATEGORIES[EXPENSE_CATEGORIES[0]][0]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(50000);
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');

  const openCreate = () => {
    setEditingExpense(null);
    setCategory(EXPENSE_CATEGORIES[0]);
    setSubCategory(EXPENSE_SUBCATEGORIES[EXPENSE_CATEGORIES[0]][0]);
    setItemName('');
    setQuantity('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setAmount(50000);
    setDescription('');
    setSupplier('');
    setReceiptNumber('');
    setPaymentMethod('ESPECES');
    setIsModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setCategory(expense.category);
    setSubCategory('');
    setItemName(expense.itemName || '');
    setQuantity(expense.quantity || '');
    setExpenseDate(expense.date);
    setAmount(expense.amount);
    setDescription(expense.description);
    setSupplier(expense.supplier || '');
    setReceiptNumber(expense.reference || '');
    setPaymentMethod(expense.paymentMethod);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const recordedBy = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Gestionnaire Umoja';
    const expenseData = {
      date: expenseDate,
      service: 'ADMINISTRATION',
      category,
      itemName: subCategory && !editingExpense ? `${subCategory}${itemName.trim() ? ' — ' + itemName.trim() : ''}` : itemName.trim() || undefined,
      quantity: quantity === '' ? undefined : quantity,
      amount,
      description,
      supplier: supplier.trim() || undefined,
      reference: receiptNumber.trim() || undefined,
      paymentMethod,
      recordedBy,
    };

    if (editingExpense) {
      const updated = await updateExpense(editingExpense.id, expenseData);
      if (updated) {
        window.alert('Dépense modifiée avec succès.');
        setIsModalOpen(false);
      }
      return;
    }

    const created = await recordExpense(expenseData);

    if (created) {
      window.alert('Dépense enregistrée avec succès dans la caisse.');
      setIsModalOpen(false);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
    return true;
  });

  const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const dailyTotal = expenses.filter(expense => expense.date === today).reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyTotal = expenses.filter(expense => expense.date.slice(0, 7) === currentMonth).reduce((sum, expense) => sum + expense.amount, 0);
  const periodStart = new Date(now);
  if (analysisPeriod === 'WEEKLY') periodStart.setDate(now.getDate() - 6);
  if (analysisPeriod === 'MONTHLY') periodStart.setDate(now.getDate() - 29);
  const periodExpenses = expenses.filter(expense => new Date(`${expense.date}T00:00:00`) >= new Date(periodStart.toDateString()));
  const categoryAnalysis = EXPENSE_CATEGORIES.map(name => ({
    name,
    expenses: periodExpenses.filter(expense => expense.category === name),
  })).filter(group => group.expenses.length > 0).map(group => ({
    ...group,
    total: group.expenses.reduce((sum, expense) => sum + expense.amount, 0),
  }));
  const periodTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const periodRevenue = invoices
    .filter(invoice => invoice.status === 'PAYEE' && new Date(invoice.paidAt || invoice.createdAt) >= new Date(periodStart.toDateString()))
    .reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const estimatedNet = periodRevenue - periodTotal;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            Gestion des Dépenses & Achats Fournisseurs
          </h2>
          <p className="text-xs text-stone-400">Enregistrement des charges d'exploitation, achats de vivres et factures</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-stone-950 px-3.5 py-1.5 rounded-xl border border-stone-800 text-xs"><span className="text-stone-400 block text-[10px]">Total journalier</span><strong className="text-rose-400 font-mono font-black text-sm">{formatFC(dailyTotal)}</strong></div>
          <div className="bg-stone-950 px-3.5 py-1.5 rounded-xl border border-stone-800 text-xs"><span className="text-stone-400 block text-[10px]">Total mensuel</span><strong className="text-rose-400 font-mono font-black text-sm">{formatFC(monthlyTotal)}</strong></div>
          <div className="bg-stone-950 px-3.5 py-1.5 rounded-xl border border-stone-800 text-xs"><span className="text-stone-400 block text-[10px]">Total général</span><strong className="text-rose-400 font-mono font-black text-sm">{formatFC(totalExpenseSum)}</strong></div>

          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition shadow flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer Dépense</span>
          </button>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-800 pb-3">
          <div><h3 className="text-sm font-bold text-stone-100">Analyse des dépenses par catégorie</h3><p className="text-xs text-stone-400">Données enregistrées dans Supabase</p></div>
          <div className="flex gap-1 rounded-lg bg-stone-950 p-1">
            {([['DAILY', 'Quotidien'], ['WEEKLY', 'Hebdomadaire'], ['MONTHLY', 'Mensuel']] as const).map(([value, label]) => <button key={value} onClick={() => setAnalysisPeriod(value)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${analysisPeriod === value ? 'bg-rose-600 text-white' : 'text-stone-400 hover:text-stone-200'}`}>{label}</button>)}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-2">
            {categoryAnalysis.length === 0 ? <p className="py-6 text-center text-xs text-stone-500">Aucune dépense enregistrée pour cette période.</p> : categoryAnalysis.map(group => <div key={group.name} className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="font-bold text-amber-300">{group.name}</span><strong className="font-mono text-rose-400">{formatFC(group.total)}</strong></div><div className="mt-2 space-y-1 border-t border-stone-800 pt-2 text-stone-400">{group.expenses.map(expense => <div key={expense.id} className="flex justify-between gap-3"><span className="truncate">{expense.itemName || expense.description}{expense.quantity ? ` (${expense.quantity})` : ''}</span><span className="shrink-0">{formatFC(expense.amount)}</span></div>)}</div></div>)}
          </div>
          <div className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs"><div><span className="text-stone-400">Revenus encaissés</span><strong className="mt-1 block font-mono text-emerald-400">{formatFC(periodRevenue)}</strong></div><div><span className="text-stone-400">Total des dépenses</span><strong className="mt-1 block font-mono text-rose-400">{formatFC(periodTotal)}</strong></div><div className="border-t border-stone-800 pt-3"><span className="text-stone-400">Résultat net estimatif</span><strong className={`mt-1 block text-xl font-black font-mono ${estimatedNet >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>{formatFC(estimatedNet)}</strong><span className="text-[11px] text-stone-500">Revenus − Dépenses</span></div></div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'ALL' ? 'bg-rose-600 text-white shadow' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
          }`}
        >
          Toutes ({expenses.length})
        </button>
        {expenseCategories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === c.name ? 'bg-rose-600 text-white shadow' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Article & Qté</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Fournisseur</th>
                <th className="py-3 px-4">Mode & Réf</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Enregistré par</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-stone-800/40 transition">
                  <td className="py-3 px-4 text-stone-400">{formatDateOnly(exp.date)}</td>
                  
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300 font-semibold text-[10px]">
                      {exp.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-stone-300">{exp.itemName || '-'}{exp.quantity ? ` (${exp.quantity})` : ''}</td>

                  <td className="py-3 px-4 font-bold text-stone-100">{exp.description}</td>

                  <td className="py-3 px-4 text-stone-300">{exp.supplier || '-'}</td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] text-stone-400">
                      {exp.paymentMethod} {exp.reference ? `(${exp.reference})` : ''}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-black text-rose-400 text-sm">
                    {formatFC(exp.amount)}
                  </td>

                  <td className="py-3 px-4 text-stone-400 text-[11px]">{exp.recordedBy}</td>

                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(exp)} className="mr-1.5 p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition" title="Modifier"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer la dépense de ${exp.description} ?`)) {
                          deleteExpense(exp.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col">
            
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-100">{editingExpense ? 'Modifier une Dépense' : 'Enregistrer une Nouvelle Dépense'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Catégorie *</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCategory(next);
                      setSubCategory(EXPENSE_SUBCATEGORIES[next]?.[0] || '');
                    }}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {EXPENSE_CATEGORIES.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Montant Décaissement (CNY) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Description / Motif de la dépense *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Achat sacs de charbon, légumes frais marché Gambela..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Sous-catégorie / Article acheté</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {(EXPENSE_SUBCATEGORIES[category] || []).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Précision (optionnel)</label>
                  <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ex: Tomates fraîches, origine locale" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Article ou produit acheté</label>
                  <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ex: Tomates fraîches" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Quantité</label>
                  <input type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')} placeholder="Ex: 5" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Fournisseur / Bénéficiaire</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Ex: Marché Central, SNEL, REGIDESO"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">N° Reçu / Facture Pièce Justificative</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Ex: REC-8842, BC-09"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Date *</label>
                  <input type="date" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Mode de Règlement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ESPECES">Espèces (Décaissé de la Caisse)</option>
                  <option value="M_PESA">M-Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="BANQUE">Compte Bancaire Restaurant</option>
                </select>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white transition shadow"
                >
                  {editingExpense ? 'Enregistrer les modifications' : 'Enregistrer la Dépense'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
