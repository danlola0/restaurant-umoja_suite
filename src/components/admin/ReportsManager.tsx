import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFC, formatDateOnly, formatDateTime } from '../../utils/formatters';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Utensils, 
  Layers, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';

export const ReportsManager: React.FC = () => {
  const { 
    orders, 
    invoices, 
    expenses, 
    employees, 
    attendanceRecords, 
    cashRegister, 
    products 
  } = useRestaurant();

  const [activeReportTab, setActiveReportTab] = useState<'FINANCIER' | 'VENTES' | 'RH' | 'CAISSE'>('FINANCIER');

  const totalRevenue = invoices.filter(i => i.status === 'PAYEE').reduce((sum, i) => sum + i.paidAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netMargin = totalRevenue - totalExpenses;
  const totalSalaries = employees.filter(e => e.statut === 'ACTIF').reduce((sum, e) => sum + (e.salaireBase || e.salaire || 0), 0);

  // Export to CSV Function
  const exportToCSV = (dataType: string) => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `rapport_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (dataType === 'invoices') {
      headers = ['Numero', 'Date', 'Table', 'Caissier/Serveur', 'Total (FC)', 'Mode Paiement', 'Statut'];
      rows = invoices.map(inv => [
        inv.invoiceNumber,
        inv.createdAt,
        inv.tableCode,
        inv.cashierName || '-',
        inv.totalAmount,
        inv.paymentMethod || 'N/A',
        inv.status
      ]);
    } else if (dataType === 'expenses') {
      headers = ['ID', 'Date', 'Categorie', 'Description', 'Fournisseur', 'Montant (FC)', 'Mode', 'Enregistre Par'];
      rows = expenses.map(exp => [
        exp.id,
        exp.date,
        exp.category,
        `"${exp.description.replace(/"/g, '""')}"`,
        exp.supplier || '-',
        exp.amount,
        exp.paymentMethod,
        exp.recordedBy
      ]);
    } else if (dataType === 'attendance') {
      headers = ['ID', 'Date', 'Heure', 'Matricule', 'Nom Employe', 'Type', 'Statut', 'Retard (min)'];
      rows = attendanceRecords.map(att => [
        att.id,
        att.date,
        att.time,
        att.matricule,
        att.employeeName,
        att.type,
        att.status,
        att.delayMinutes
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Rapports d'Activité & Exports Comptables
          </h2>
          <p className="text-xs text-stone-400">États financiers certifiés, synthèse commerciale et extraction Excel / CSV</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>

          <button
            onClick={() => exportToCSV(activeReportTab === 'FINANCIER' ? 'invoices' : activeReportTab === 'RH' ? 'attendance' : 'expenses')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold transition shadow flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
        {[
          { key: 'FINANCIER', label: 'Bilan Financier & Recettes', icon: DollarSign },
          { key: 'VENTES', label: 'Ventes & Plats Stars', icon: Utensils },
          { key: 'RH', label: 'Rapport RH & Masse Salariale', icon: Users },
          { key: 'CAISSE', label: 'Journal des Encaissements', icon: Layers },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveReportTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report 1: Financial Statement */}
      {activeReportTab === 'FINANCIER' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
              <span className="text-xs text-stone-400">Total Recettes Encaissées (TTC)</span>
              <div className="text-2xl font-mono font-black text-emerald-400 mt-1">{formatFC(totalRevenue)}</div>
              <div className="text-[11px] text-stone-500 mt-1">{invoices.length} factures acquittées</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
              <span className="text-xs text-stone-400">Total Charges Décaissées</span>
              <div className="text-2xl font-mono font-black text-rose-400 mt-1">{formatFC(totalExpenses)}</div>
              <div className="text-[11px] text-stone-500 mt-1">{expenses.length} postes de dépense</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
              <span className="text-xs text-stone-400">Bénéfice Net d'Exploitation</span>
              <div className="text-2xl font-mono font-black text-amber-400 mt-1">{formatFC(netMargin)}</div>
              <div className="text-[11px] text-stone-500 mt-1">Marge : {totalRevenue > 0 ? Math.round((netMargin / totalRevenue) * 100) : 0}%</div>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow space-y-3">
            <h3 className="text-sm font-bold text-stone-100">Dernières Factures Encaissées</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
                  <tr>
                    <th className="py-2.5 px-3">N° Facture</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Table</th>
                    <th className="py-2.5 px-3">Serveur</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {invoices.slice(0, 10).map(inv => (
                    <tr key={inv.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-200">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-stone-400">{formatDateTime(inv.createdAt)}</td>
                      <td className="py-2.5 px-3">{inv.tableCode}</td>
                      <td className="py-2.5 px-3 text-stone-400">{inv.waiterName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] font-semibold text-amber-400">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatFC(inv.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Sales */}
      {activeReportTab === 'VENTES' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow space-y-4">
          <h3 className="text-sm font-bold text-stone-100">Performance des Ventes par Produit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <div className="font-bold text-xs text-stone-200">{p.name}</div>
                    <div className="text-[10px] text-stone-500">Prix : {formatFC(p.price)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.available ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {p.available ? 'En vente' : 'Rupture'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report 3: RH */}
      {activeReportTab === 'RH' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
              <span className="text-xs text-stone-400">Effectif Actif</span>
              <div className="text-2xl font-mono font-black text-stone-100 mt-1">
                {employees.filter(e => e.statut === 'ACTIF').length} employés
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
              <span className="text-xs text-stone-400">Masse Salariale Mensuelle Prévue</span>
              <div className="text-2xl font-mono font-black text-amber-400 mt-1">{formatFC(totalSalaries)}</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow">
              <span className="text-xs text-stone-400">Cumul Pointages Archivés</span>
              <div className="text-2xl font-mono font-black text-sky-400 mt-1">{attendanceRecords.length} records</div>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Cash summary */}
      {activeReportTab === 'CAISSE' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow space-y-4">
          <h3 className="text-sm font-bold text-stone-100">Synthèse des Modes d'Encaissement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
              <span className="text-xs text-emerald-400 font-bold block">Espèces Caisse</span>
              <div className="text-xl font-mono font-black text-stone-100 mt-1">{formatFC(cashRegister.totalSalesCash)}</div>
            </div>

            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
              <span className="text-xs text-rose-400 font-bold block">Mobile Money</span>
              <div className="text-xl font-mono font-black text-stone-100 mt-1">{formatFC(cashRegister.totalSalesMobile)}</div>
            </div>

            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
              <span className="text-xs text-sky-400 font-bold block">Cartes / TPE</span>
              <div className="text-xl font-mono font-black text-stone-100 mt-1">{formatFC(cashRegister.totalSalesCard)}</div>
            </div>

            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
              <span className="text-xs text-indigo-400 font-bold block">Virements Banque</span>
              <div className="text-xl font-mono font-black text-stone-100 mt-1">{formatFC(cashRegister.totalSalesBank)}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
