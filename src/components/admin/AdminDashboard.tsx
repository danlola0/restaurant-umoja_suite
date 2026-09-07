import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFC, formatDateTime } from '../../utils/formatters';
import { paymentMethodLabel } from '../../lib/cashierOrders';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { 
    orders, 
    invoices, 
    expenses, 
    cashRegister, 
    tables, 
    employees, 
    attendanceRecords, 
    products,
    currentRole,
    cancelPaidSale,
  } = useRestaurant();

  const [saleToCancel, setSaleToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Financial KPIs
  const paidInvoices = invoices.filter(i => i.status === 'PAYEE');
  const totalSalesAll = paidInvoices.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netOperatingProfit = totalSalesAll - totalExpenses;
  const averageTicket = paidInvoices.length > 0 ? Math.round(totalSalesAll / paidInvoices.length) : 0;

  // Hourly sales chart data (Simulation based on actual orders)
  const hourlyData = [
    { hour: '11h', sales: 45000, orders: 2 },
    { hour: '12h', sales: 120000, orders: 5 },
    { hour: '13h', sales: 210000, orders: 8 },
    { hour: '14h', sales: 95000, orders: 4 },
    { hour: '18h', sales: 160000, orders: 6 },
    { hour: '19h', sales: 280000, orders: 9 },
    { hour: '20h', sales: 340000, orders: 12 },
    { hour: '21h', sales: 190000, orders: 7 },
  ];

  // Payment Breakdown
  const paymentBreakdownData = [
    { name: 'Cash', value: cashRegister.totalSalesCash || 0, color: '#10b981' },
    { name: 'WeChat / Alipay', value: cashRegister.totalSalesMobile || 0, color: '#07c160' },
    { name: 'UnionPay / Card', value: cashRegister.totalSalesCard || 0, color: '#38bdf8' },
  ].filter(d => d.value > 0);

  // Top Selling Dishes Breakdown
  const productSalesMap = new Map<string, { name: string; count: number; revenue: number }>();
  orders.filter(order => order.status !== 'ANNULEE').forEach(order => {
    order.items.forEach(it => {
      if (productSalesMap.has(it.productName)) {
        const item = productSalesMap.get(it.productName)!;
        item.count += it.quantity;
        item.revenue += it.subtotal;
      } else {
        productSalesMap.set(it.productName, {
          name: it.productName,
          count: it.quantity,
          revenue: it.subtotal,
        });
      }
    });
  });

  const topProductsData = Array.from(productSalesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const isAdmin = currentRole === 'ADMINISTRATEUR' || currentRole === 'RESPONSABLE';
  const saleTransactions = [...invoices]
    .filter(invoice => invoice.status === 'PAYEE' || invoice.status === 'ANNULEE')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pendingCancel = invoices.find(invoice => invoice.id === saleToCancel);

  const confirmCancelSale = async () => {
    if (!saleToCancel) return;
    setIsCancelling(true);
    const ok = await cancelPaidSale(saleToCancel);
    setIsCancelling(false);
    if (ok) setSaleToCancel(null);
  };
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendanceRecords.filter(a => a.date === todayStr);
  const presentEmployeesCount = new Set(todayAttendances.filter(a => a.type === 'ENTREE').map(a => a.matricule)).size;
  const latesCount = todayAttendances.filter(a => a.status === 'RETARD').length;

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Chiffre d'Affaires Encaissé</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
            {formatFC(totalSalesAll)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Factures payées uniquement
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Dépenses & Achats</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2">
            {formatFC(totalExpenses)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {expenses.length} dépenses enregistrées
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Solde Opérationnel Net</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono mt-2 ${netOperatingProfit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatFC(netOperatingProfit)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {netOperatingProfit < 0 ? 'Perte' : netOperatingProfit === 0 ? 'Équilibre (0)' : 'Bénéfice'} : ventes payées − achats
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Présence Personnel RH</span>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-sky-400 mt-2">
            {presentEmployeesCount} / {employees.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>Taux : {Math.round((presentEmployeesCount / (employees.length || 1)) * 100)}%</span>
            {latesCount > 0 && <span className="text-rose-400 font-bold">{latesCount} retards</span>}
          </div>
        </div>

      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800 px-5 py-3">
          <div>
            <h3 className="font-bold text-sm text-stone-100">Ventes & transactions encaissées</h3>
            <p className="text-xs text-stone-400">Annuler une vente retire son montant du CA et du bénéfice net.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Facture</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Paiement</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Statut</th>
                {isAdmin && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {saleTransactions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-10 text-center text-stone-500">Aucune vente enregistrée.</td>
                </tr>
              )}
              {saleTransactions.map(invoice => {
                const cancelled = invoice.status === 'ANNULEE';
                return (
                  <tr key={invoice.id} className={cancelled ? 'bg-stone-950/40 opacity-60' : 'hover:bg-stone-800/40'}>
                    <td className="py-3 px-4 text-stone-400 whitespace-nowrap">{formatDateTime(invoice.paidAt || invoice.createdAt)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-stone-100">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-4">{invoice.tableCode || '—'}</td>
                    <td className="py-3 px-4">{paymentMethodLabel(invoice.paymentMethod)}</td>
                    <td className={`py-3 px-4 font-mono font-bold ${cancelled ? 'line-through text-stone-500' : 'text-emerald-400'}`}>
                      {formatFC(Number(invoice.paidAmount || invoice.totalAmount || 0))}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cancelled ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                        {cancelled ? 'Annulée' : 'Payée'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {!cancelled && (
                          <button
                            type="button"
                            onClick={() => setSaleToCancel(invoice.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800/60 bg-rose-950/70 px-2.5 py-1.5 text-[11px] font-bold text-rose-300 transition hover:bg-rose-900 hover:text-rose-100"
                            title="Supprimer / Annuler la transaction"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Annuler
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Dynamic Curve (8 cols) */}
        <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-100">Évolution des Ventes par Tranche Horaire</h3>
              <p className="text-xs text-stone-400">Pic d'activité restaurant midi et soir</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Panier moyen : {formatFC(averageTicket)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis dataKey="hour" stroke="#78716c" tick={{ fill: '#78716c', fontSize: 11 }} />
                <YAxis 
                  stroke="#78716c" 
                  tick={{ fill: '#78716c', fontSize: 11 }}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(value: number) => [formatFC(value), 'Recettes']}
                  labelFormatter={(lbl) => `Heure : ${lbl}`}
                />
                <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-stone-800 pb-3">
            <h3 className="font-bold text-sm text-stone-100">Répartition des Encaissements</h3>
            <p className="text-xs text-stone-400">Par mode de paiement utilisé</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: number) => formatFC(val)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-stone-800 text-xs">
            {paymentBreakdownData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-stone-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                </div>
                <span className="font-mono font-bold">{formatFC(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Best-Sellers Dishes */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-stone-100">Top Plats & Spécialités les Plus Vendus</h3>
            <p className="text-xs text-stone-400">Performances commerciales du menu Umoja</p>
          </div>
          <span className="text-xs text-stone-400 font-mono">{products.length} plats au menu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topProductsData.map((dish, idx) => (
            <div key={idx} className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">{dish.count} vendus</span>
              </div>
              <div className="font-bold text-xs text-stone-200 line-clamp-1">{dish.name}</div>
              <div className="text-xs font-mono text-amber-400 font-extrabold">{formatFC(dish.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      {pendingCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-5 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-sm font-bold text-stone-100">Annuler cette vente ?</h3>
              <button type="button" onClick={() => setSaleToCancel(null)} className="p-1 text-stone-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-stone-300">
              Êtes-vous sûr de vouloir supprimer cette vente ? Cela recalculera le chiffre d’affaires et le solde.
            </p>
            <p className="mt-2 font-mono text-xs text-amber-300">
              {pendingCancel.invoiceNumber} · {formatFC(Number(pendingCancel.paidAmount || pendingCancel.totalAmount || 0))}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSaleToCancel(null)} className="rounded-xl bg-stone-800 px-4 py-2 text-xs font-bold text-stone-200">
                Non, conserver
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => void confirmCancelSale()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {isCancelling ? 'Annulation…' : 'Oui, supprimer / annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
