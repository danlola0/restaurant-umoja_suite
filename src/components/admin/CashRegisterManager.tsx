import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { CashRegisterSession } from '../../types';
import { formatFC, formatDateTime } from '../../utils/formatters';
import { 
  CreditCard, 
  DollarSign, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  FileText, 
  Sparkles,
  Calculator
} from 'lucide-react';

export const CashRegisterManager: React.FC = () => {
  const { 
    cashRegister, 
    cashClosuresHistory, 
    openCashRegister, 
    closeCashRegister, 
    currentUser 
  } = useRestaurant();

  const [openingAmountInput, setOpeningAmountInput] = useState<number>(50000);
  const [realCountInput, setRealCountInput] = useState<number>(cashRegister.theoreticalBalance);
  const [justificationInput, setJustificationInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [showClosureModal, setShowClosureModal] = useState<boolean>(false);
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);

  const variance = realCountInput - cashRegister.theoreticalBalance;
  const isClosed = cashRegister.status === 'CLOSED';

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const opener = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Caissier Umoja';
    openCashRegister(openingAmountInput, opener);
    setShowOpenModal(false);
  };

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const closer = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Responsable Caisse';
    closeCashRegister(realCountInput, justificationInput.trim(), closer, notesInput.trim() || undefined);
    setShowClosureModal(false);
  };

  const totalAllSalesToday = (cashRegister.totalSalesCash || 0) + (cashRegister.totalSalesMobile || 0) + (cashRegister.totalSalesCard || 0) + (cashRegister.totalSalesBank || 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${
            isClosed
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {isClosed ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-100">
                Gestion de Caisse & Clôtures Journalières
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isClosed
                  ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
              }`}>
                {isClosed ? 'Caisse Clôturée' : 'Session Active Ouverte'}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Ouverte par <strong>{cashRegister.openedBy}</strong> le {formatDateTime(cashRegister.openedAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons (Open or Close) */}
        <div className="flex items-center gap-2">
          {isClosed ? (
            <button
              onClick={() => {
                setOpeningAmountInput(50000);
                setShowOpenModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs shadow flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Ouvrir une Nouvelle Session</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setRealCountInput(cashRegister.theoreticalBalance);
                setJustificationInput('');
                setShowClosureModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span>Effectuer la Clôture de Caisse (Z)</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-stone-400 font-medium block">Fond de Caisse Initial</span>
          <div className="text-xl font-mono font-black text-stone-100 mt-1">
            {formatFC(cashRegister.openingBalance)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Dépôt initial à l'ouverture</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-stone-400 font-medium block">Recettes Espèces</span>
          <div className="text-xl font-mono font-black text-emerald-400 mt-1">
            + {formatFC(cashRegister.totalSalesCash)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Encaissements billets / pièces</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-stone-400 font-medium block">Décaissements / Dépenses Caisse</span>
          <div className="text-xl font-mono font-black text-rose-400 mt-1">
            - {formatFC(cashRegister.totalExpenses)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Achats & sorties immédiates</div>
        </div>

        <div className="bg-stone-900 border-2 border-amber-500/50 rounded-2xl p-4 shadow-lg bg-amber-950/20">
          <span className="text-xs text-amber-300 font-bold block">Solde Théorique Espèces</span>
          <div className="text-2xl font-mono font-black text-amber-400 mt-1">
            {formatFC(cashRegister.theoreticalBalance)}
          </div>
          <div className="text-[11px] text-amber-200/80 mt-1">Fond + Ventes Espèces - Dépenses</div>
        </div>

      </div>

      {/* Non-Cash Channels Breakdown */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-stone-200">
          Encaissements Canaux Électroniques & Bancaires (Hors Espèces)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-400 font-bold block">Mobile Money (M-Pesa, Airtel, Orange)</span>
              <span className="text-base font-mono font-black text-stone-100">{formatFC(cashRegister.totalSalesMobile)}</span>
            </div>
          </div>

          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-sky-400 font-bold block">Cartes Bancaires / TPE</span>
              <span className="text-base font-mono font-black text-stone-100">{formatFC(cashRegister.totalSalesCard)}</span>
            </div>
          </div>

          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-400 font-bold block">Virements & Chèques Bancaires</span>
              <span className="text-base font-mono font-black text-stone-100">{formatFC(cashRegister.totalSalesBank)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Closures List */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-stone-100">Historique des Clôtures & Écarts de Caisse</h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">{cashClosuresHistory.length} clôtures archivées</span>
        </div>

        {cashClosuresHistory.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            Aucune clôture archivée pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {cashClosuresHistory.map((sess, idx) => (
              <div key={idx} className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-stone-200">Clôture du {formatDateTime(sess.closedAt)}</span>
                    <span className="text-stone-400 ml-2">par {sess.closedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Théorique: <strong className="font-mono text-stone-200">{formatFC(sess.theoreticalBalance)}</strong></span>
                    <span className="text-stone-400">Compté: <strong className="font-mono text-amber-400">{formatFC(sess.realBalance || 0)}</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (sess.variance || 0) === 0
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                        : 'bg-rose-950 text-rose-300 border border-rose-600/50'
                    }`}>
                      Écart: {formatFC(sess.variance || 0)}
                    </span>
                  </div>
                </div>
                {sess.varianceReason && (
                  <p className="text-[11px] text-amber-300/90 italic bg-stone-900 p-2 rounded border border-stone-800">
                    Justification écart : {sess.varianceReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Open Register */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col">
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-100">Ouverture de Session de Caisse</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleOpenRegister} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  Fond de Caisse Initial (FC) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  required
                  value={openingAmountInput}
                  onChange={(e) => setOpeningAmountInput(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-sm font-mono font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                >
                  Valider l'ouverture de caisse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Close Register (Z) */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col">
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-100">Clôture Journalière de Caisse (Rapport Z)</h3>
              <button onClick={() => setShowClosureModal(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCloseRegister} className="p-5 space-y-4">
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Solde théorique attendu en caisse :</span>
                  <strong className="font-mono text-stone-200">{formatFC(cashRegister.theoreticalBalance)}</strong>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Recettes totales tous modes confondus :</span>
                  <strong className="font-mono text-emerald-400">{formatFC(totalAllSalesToday)}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  Montant Réel Compté Physiquement dans le tiroir-caisse (FC) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={realCountInput}
                  onChange={(e) => setRealCountInput(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-base font-mono font-black text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Live Variance computation */}
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                variance === 0
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
              }`}>
                <span>Écart de Caisse constaté :</span>
                <strong className="font-mono font-bold text-sm">
                  {variance > 0 ? `+${formatFC(variance)} (Excédent)` : variance < 0 ? `${formatFC(variance)} (Déficit)` : '0 FC (Parfait)'}
                </strong>
              </div>

              {variance !== 0 && (
                <div>
                  <label className="text-xs font-bold text-rose-300 block mb-1">
                    Justification obligatoire de l'écart (traçabilité audit) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={justificationInput}
                    onChange={(e) => setJustificationInput(e.target.value)}
                    placeholder="Précisez la cause de l'excédent ou du manquant..."
                    className="w-full bg-stone-950 border border-rose-700/60 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-stone-400 block mb-1">
                  Observations générales de fin de service (optionnel)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ex: Bon déroulement du service du soir"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={variance !== 0 && !justificationInput.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 shadow disabled:opacity-50"
                >
                  Valider et Clôturer la Caisse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
