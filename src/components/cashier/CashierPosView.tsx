import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantTable, Invoice, TableSession } from '../../types';
import { formatFC, formatDateTime, formatTimeOnly } from '../../utils/formatters';
import { InvoiceModal } from './InvoiceModal';
import { PaymentModal } from './PaymentModal';
import { ServiceExpensePanel } from '../common/ServiceExpensePanel';
import { invoiceGuestLabel, invoiceLineItems, paymentMethodLabel } from '../../lib/cashierOrders';
import { 
  CreditCard, 
  Utensils, 
  Receipt, 
  Users, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Layers, 
  Sparkles,
  Search,
  Filter,
  Eye,
  RefreshCw
} from 'lucide-react';

export const CashierPosView: React.FC = () => {
  const { 
    tables, 
    orders, 
    tableSessions, 
    invoices, 
    cashRegister, 
    openTableSession, 
    generateInvoiceForTable, 
    updateTableStatus,
    currentUser,
    selectedTableId,
    setSelectedTableId
  } = useRestaurant();

  const [selectedTableLocalId, setSelectedTableLocalId] = useState<string>(selectedTableId || (tables[0]?.id ?? 'tbl-01'));
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState<boolean>(false);
  const [guestCountInput, setGuestCountInput] = useState<number>(2);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'TABLES' | 'INVOICES'>('TABLES');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  const selectedTable = tables.find(t => t.id === selectedTableLocalId) || tables[0] || {
    id: 'tbl-01',
    code: 'Table 01',
    name: 'Table 01',
    zone: 'Salle Principale',
    capacity: 4,
    status: 'LIBRE'
  };

  // Zones list
  const zones = Array.from(new Set(tables.map(t => t.zone)));

  // Filtered tables
  const filteredTables = tables.filter(t => {
    if (selectedZone !== 'ALL' && t.zone !== selectedZone) return false;
    return true;
  });

  // Table active session & orders
  const activeSession = selectedTable ? tableSessions.find(s => s.tableId === selectedTable.id && s.status === 'ACTIVE') : undefined;
  const tableOrders = activeSession 
    ? orders.filter(o => activeSession.orderIds.includes(o.id) && o.status !== 'ANNULEE')
    : (selectedTable ? orders.filter(o => o.tableId === selectedTable.id && o.status !== 'ANNULEE').slice(0, 5) : []);

  const tableInvoice = selectedTable ? invoices.find(inv => inv.tableId === selectedTable.id && inv.status === 'EN_ATTENTE') : undefined;
  const sessionTotal = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Status styling helper
  const getTableStatusConfig = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'LIBRE':
        return {
          bg: 'bg-emerald-950/20 border-emerald-600/40 text-emerald-400',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-600/50',
          label: 'Libre',
        };
      case 'OCCUPEE':
        return {
          bg: 'bg-sky-950/20 border-sky-600/40 text-sky-400',
          badge: 'bg-sky-950 text-sky-300 border-sky-600/50',
          label: 'Occupée',
        };
      case 'COMMANDE_EN_COURS':
        return {
          bg: 'bg-amber-950/30 border-amber-500/60 text-amber-400',
          badge: 'bg-amber-950 text-amber-300 border-amber-500/60 animate-pulse',
          label: 'En Cuisine',
        };
      case 'A_PAYER':
        return {
          bg: 'bg-rose-950/40 border-rose-500 text-rose-300',
          badge: 'bg-rose-950 text-rose-200 border-rose-500 animate-bounce',
          label: 'À Payer',
        };
      case 'NETTOYAGE':
        return {
          bg: 'bg-stone-900 border-stone-700 text-stone-400',
          badge: 'bg-stone-800 text-stone-400 border-stone-700',
          label: 'Nettoyage',
        };
    }
  };

  const handleGenerateBill = () => {
    const cashierName = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Caissier Umoja';
    const invoice = generateInvoiceForTable(selectedTable.id, cashierName, discountInput);
    if (invoice) {
      setViewInvoice(invoice);
      setDiscountInput(0);
    }
  };

  const totalCollectedToday = (cashRegister.totalSalesCash || 0) + (cashRegister.totalSalesMobile || 0) + (cashRegister.totalSalesCard || 0) + (cashRegister.totalSalesBank || 0);
  const occupiedTablesCount = tables.filter(t => t.status !== 'LIBRE').length;
  const pendingInvoicesCount = invoices.filter(i => i.status === 'EN_ATTENTE').length;
  const historyInvoices = [...invoices]
    .sort((a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())
    .filter(inv => {
      const q = invoiceSearch.trim().toLowerCase();
      if (!q) return true;
      const guest = invoiceGuestLabel(inv, orders).toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q)
        || guest.includes(q)
        || (inv.paymentMethod || '').toLowerCase().includes(q)
        || paymentMethodLabel(inv.paymentMethod).toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100 p-4 sm:p-6 space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Recettes Encaissées</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-2">
            {formatFC(totalCollectedToday)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Caisse du jour active</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Tables Occupées</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-amber-400 mt-2">
            {occupiedTablesCount} / {tables.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Taux d'occupation : {Math.round((occupiedTablesCount / tables.length) * 100)}%</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Factures en Attente</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-rose-400 mt-2">
            {pendingInvoicesCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Addition demandée</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Solde Caisse Espèces</span>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-sky-400 mt-2">
            {formatFC(cashRegister.theoreticalBalance)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Fond + Encaissements</div>
        </div>

      </div>

      <ServiceExpensePanel service="CAISSE" title="Caisse" />

      <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-2xl p-1.5 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('TABLES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'TABLES' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-100'}`}
        >
          Plan de salle
        </button>
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'INVOICES' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-100'}`}
        >
          Historique des Factures
        </button>
      </div>

      {activeTab === 'TABLES' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Floor Plan Grid (8 cols) */}
        <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Header & Zone Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Plan de Salle & Tables en Direct
              </h2>
              <p className="text-xs text-stone-400">Sélectionnez une table pour afficher sa facture et ses commandes</p>
            </div>

            {/* Zone Filter Tabs */}
            <div className="flex max-w-full items-center gap-1.5 overflow-x-auto bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setSelectedZone('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedZone === 'ALL' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-white'
                }`}
              >
                Toutes ({tables.length})
              </button>
              {zones.map(z => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedZone === z ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Tables Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredTables.map(t => {
              const cfg = getTableStatusConfig(t.status);
              const isSelected = selectedTable.id === t.id;
              const hasOrders = orders.some(o => o.tableId === t.id && !['SERVIE', 'ANNULEE'].includes(o.status));

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTableLocalId(t.id);
                    setSelectedTableId(t.id);
                  }}
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between min-h-[130px] relative ${
                    isSelected ? 'ring-4 ring-amber-500/30 scale-[1.02]' : 'hover:scale-[1.01]'
                  } ${cfg.bg}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base tracking-tight">{t.code}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-75 mt-0.5">
                      {t.zone} • {t.capacity} places
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-stone-400 truncate max-w-[80px]">
                      {t.waiterName || 'Personnel'}
                    </span>
                    {t.status !== 'LIBRE' && (
                      <span className="font-mono font-bold text-amber-300">
                        {hasOrders ? 'Commandes' : t.status === 'A_PAYER' ? 'À Régler' : 'Active'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right: Table Inspector & Checkout Panel (4 cols) */}
        <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          
          <div className="space-y-4">
            
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-amber-400">{selectedTable.code}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-800 text-stone-300">
                    {selectedTable.zone}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Serveur assigné : <strong>{selectedTable.waiterName || 'Équipe Umoja'}</strong>
                </p>
              </div>

              {/* Status control */}
              <select
                value={selectedTable.status}
                onChange={(e) => updateTableStatus(selectedTable.id, e.target.value as RestaurantTable['status'])}
                className="bg-stone-950 text-stone-200 border border-stone-700 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="LIBRE">Libre</option>
                <option value="OCCUPEE">Occupée</option>
                <option value="COMMANDE_EN_COURS">En Cuisine</option>
                <option value="A_PAYER">À Payer</option>
                <option value="NETTOYAGE">Nettoyage</option>
              </select>
            </div>

            {/* Table Orders Breakdown */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-stone-300 mb-2">
                <span>Commandes de la table ({tableOrders.length})</span>
                <span className="text-amber-400 font-mono">Total : {formatFC(sessionTotal)}</span>
              </div>

              {tableOrders.length === 0 ? (
                <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-6 text-center text-stone-500 space-y-2">
                  <Utensils className="w-8 h-8 mx-auto text-stone-700" />
                  <p className="text-xs font-medium">Aucune commande active sur cette table.</p>
                  {selectedTable.status === 'LIBRE' && (
                    <button
                      onClick={() => openTableSession(selectedTable.id, selectedTable.capacity, currentUser ? `${currentUser.prenom} ${currentUser.nom}` : undefined)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow"
                    >
                      Ouvrir la table
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tableOrders.map(ord => (
                    <div
                      key={ord.id}
                      className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400">{ord.orderNumber}</span>
                        <span className="text-[10px] text-stone-400">{formatTimeOnly(ord.createdAt)}</span>
                        <span className="font-mono font-bold text-stone-200">{formatFC(ord.totalAmount)}</span>
                      </div>
                      <div className="text-[11px] text-stone-400 space-y-0.5">
                        {ord.items.length === 0
                          ? 'Détail des plats indisponible'
                          : ord.items.map(i => (
                            <div key={i.id} className="flex justify-between gap-2">
                              <span>{i.quantity}× {i.productName}</span>
                              <span className="font-mono">{formatFC(i.subtotal)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invoice details if generated */}
            {tableInvoice && (
              <div className="bg-amber-950/30 border border-amber-600/50 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Receipt className="w-4 h-4" />
                    Facture {tableInvoice.invoiceNumber}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Prête pour règlement</span>
                </div>
                <div className="flex justify-between text-sm font-mono font-black text-stone-100">
                  <span>Net à payer :</span>
                  <span className="text-amber-400">{formatFC(tableInvoice.totalAmount)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setViewInvoice(tableInvoice)}
                    className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition text-center"
                  >
                    Voir Ticket
                  </button>
                  <button
                    onClick={() => setPayInvoice(tableInvoice)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition text-center"
                  >
                    Encaisser
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Actions for Selected Table */}
          <div className="space-y-2.5 pt-3 border-t border-stone-800">
            {tableOrders.length > 0 && !tableInvoice && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discountInput || ''}
                    onChange={(e) => setDiscountInput(Number(e.target.value))}
                        placeholder="Remise commerciale (CNY)"
                    className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={handleGenerateBill}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Générer la Facture Globale ({formatFC(sessionTotal)})
                </button>
              </>
            )}

            {selectedTable.status !== 'LIBRE' && tableOrders.length === 0 && (
              <button
                onClick={() => updateTableStatus(selectedTable.id, 'LIBRE')}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition border border-stone-700 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Libérer la table
              </button>
            )}
          </div>

        </div>

      </div>
      )}

      {activeTab === 'INVOICES' && (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-stone-100">Historique des Factures</h3>
              <p className="text-[11px] text-stone-400">Cliquez une ligne pour voir et réimprimer le reçu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="N°, table, client, mode…"
                className="bg-stone-950 border border-stone-700 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-200 w-56"
              />
            </div>
            <span className="text-xs text-stone-400 font-mono">{historyInvoices.length} / {invoices.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-2.5 px-3">N° Facture / Commande</th>
                <th className="py-2.5 px-3">Date & Heure</th>
                <th className="py-2.5 px-3">Table / Client</th>
                <th className="py-2.5 px-3">Articles</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Mode de paiement</th>
                <th className="py-2.5 px-3">Statut</th>
                <th className="py-2.5 px-3 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {historyInvoices.map(inv => {
                const items = invoiceLineItems(inv, orders);
                const guest = invoiceGuestLabel(inv, orders);
                return (
                <tr
                  key={inv.id}
                  onClick={() => setViewInvoice(inv)}
                  className="hover:bg-stone-800/40 cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                  <td className="py-2.5 px-3 text-stone-400">{formatDateTime(inv.paidAt || inv.createdAt)}</td>
                  <td className="py-2.5 px-3 font-semibold text-stone-200">{guest}</td>
                  <td className="py-2.5 px-3 text-stone-400 max-w-xs truncate">
                    {items.length ? items.map(i => `${i.quantity}x ${i.productName}`).join(', ') : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-100">{formatFC(inv.totalAmount)}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono text-[10px]">
                      {paymentMethodLabel(inv.paymentMethod)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'PAYEE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                        : 'bg-amber-950 text-amber-300 border border-amber-600/50 animate-pulse'
                    }`}>
                      {inv.status === 'PAYEE' ? 'Payée' : 'En Attente'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewInvoice(inv)}
                      className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                      title="Voir Facture / Reçu"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {inv.status !== 'PAYEE' && (
                      <button
                        onClick={() => setPayInvoice(inv)}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                      >
                        Encaisser
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {historyInvoices.length === 0 && (
            <p className="text-center text-sm text-stone-500 py-10">Aucune facture ne correspond à cette recherche.</p>
          )}
        </div>
      </div>
      )}

      {/* Invoice Ticket Modal */}
      <InvoiceModal
        invoice={viewInvoice}
        onClose={() => setViewInvoice(null)}
        onProceedToPayment={(inv) => setPayInvoice(inv)}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        invoice={payInvoice}
        onClose={() => setPayInvoice(null)}
        onSuccess={(invId) => {
          const updated = invoices.find(i => i.id === invId);
          if (updated) setViewInvoice(updated);
        }}
      />

    </div>
  );
};
