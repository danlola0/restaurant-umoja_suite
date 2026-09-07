import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFC, formatDateOnly, formatDateTime } from '../../utils/formatters';
import { RecipeProfitability } from './RecipeProfitability';
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
    products,
    currentUser
  } = useRestaurant();

  const [activeReportTab, setActiveReportTab] = useState<'FINANCIER' | 'VENTES' | 'RH' | 'CAISSE' | 'RENTABILITE'>('FINANCIER');

  const totalRevenue = invoices.filter(i => i.status === 'PAYEE').reduce((sum, i) => sum + i.paidAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netMargin = totalRevenue - totalExpenses;
  const totalSalaries = employees.filter(e => e.statut === 'ACTIF').reduce((sum, e) => sum + (e.salaireBase || e.salaire || 0), 0);

  // Export to CSV (conservé)
  const exportToCSV = (dataType: string) => {
    const { headers, rows } = buildReportData(dataType);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport_${dataType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (.xls via HTML table compatible with Excel)
  const exportToExcel = (dataType: string) => {
    const { headers, rows } = buildReportData(dataType);
    const tableRows = rows.map(row => `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`).join('');
    const amountIndex = headers.findIndex(header => /montant|total/i.test(header));
    const totalValue = amountIndex >= 0
      ? rows.reduce((sum, row) => sum + (Number(String(row[amountIndex]).replace(/[^0-9.-]/g, '')) || 0), 0)
      : 0;
    const totalRow = dataType !== 'attendance' && amountIndex >= 0
      ? `<tr>${headers.map((_, index) => index === amountIndex
        ? `<td style="font-weight:bold">${totalValue}</td>`
        : `<td style="font-weight:bold">${index === 0 ? 'TOTAL' : ''}</td>`).join('')}</tr>`
      : '';
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/><style>table{border-collapse:collapse}th,td{border:1px solid #999;padding:4px;font-size:11px}</style></head><body><h2>Rapport Umoja - ${dataType}</h2><p>Généré le ${new Date().toLocaleString('fr-FR')}</p><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}${totalRow}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${dataType}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const buildReportData = (dataType: string): { headers: string[]; rows: (string | number)[][] } => {
    if (dataType === 'invoices') {
      return {
        headers: ['Numero', 'Date', 'Table', 'Caissier/Serveur', 'Total (CNY)', 'Mode Paiement', 'Statut'],
        rows: invoices.map(inv => [inv.invoiceNumber, inv.createdAt, inv.tableCode, inv.cashierName || '-', inv.totalAmount, inv.paymentMethod || 'N/A', inv.status]),
      };
    }
    if (dataType === 'expenses') {
      return {
        headers: ['ID', 'Date', 'Categorie', 'Description', 'Fournisseur', 'Montant (CNY)', 'Mode', 'Enregistre Par'],
        rows: expenses.map(exp => [exp.id, exp.date, exp.category, exp.description, exp.supplier || '-', exp.amount, exp.paymentMethod, exp.recordedBy]),
      };
    }
    return {
      headers: ['ID', 'Date', 'Heure', 'Matricule', 'Nom Employe', 'Type', 'Statut', 'Retard (min)'],
      rows: attendanceRecords.map(att => [att.id, att.date, att.time, att.matricule, att.employeeName, att.type, att.status, att.delayMinutes]),
    };
  };

  // Export PDF via impression du rapport actif avec en-tête professionnelle
  const exportToPDF = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    const { headers, rows } = buildReportData(activeReportTab === 'FINANCIER' ? 'invoices' : activeReportTab === 'RH' ? 'attendance' : 'expenses');
    const tableRows = rows.map(row => `<tr>${row.map(cell => `<td>${String(cell)}</td>`).join('')}</tr>`).join('');
    reportWindow.document.write(`
      <html><head><title>Rapport Umoja</title><style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1c1917; }
        h1 { color: #b45309; margin-bottom: 4px; }
        .meta { color: #57534e; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #a8a29e; padding: 6px; text-align: left; }
        th { background: #292524; color: white; }
        .footer { margin-top: 16px; font-size: 11px; color: #78716c; }
      </style></head><body>
        <h1>Restaurant Umoja</h1>
        <div class="meta">Rapport : ${activeReportTab} • Généré le ${new Date().toLocaleString('fr-FR')} • Par ${currentUser ? currentUser.prenom + ' ' + currentUser.nom : 'Administrateur'}</div>
        <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
        <div class="footer">Document généré automatiquement depuis Supabase.</div>
      </body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
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
            onClick={() => exportToPDF()}
            className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exporter PDF</span>
          </button>

          <button
            onClick={() => exportToExcel(activeReportTab === 'FINANCIER' ? 'invoices' : activeReportTab === 'RH' ? 'attendance' : 'expenses')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter Excel</span>
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
          { key: 'RENTABILITE', label: 'Rentabilité des recettes', icon: TrendingUp },
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

      {activeReportTab === 'RENTABILITE' && <RecipeProfitability />}

    </div>
  );
};
