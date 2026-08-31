import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { OrderStatus } from '../../types';
import { formatFC, formatTimeOnly } from '../../utils/formatters';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Sparkles, 
  UtensilsCrossed, 
  AlertCircle, 
  Receipt, 
  BellRing,
  ArrowRight,
  Flame
} from 'lucide-react';

export const ClientOrderTracker: React.FC = () => {
  const { selectedTableId, tables, orders, tableSessions, addNotification, updateTableStatus } = useRestaurant();

  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];

  const activeSession =
    tableSessions.find(s => s.tableId === currentTable.id && s.status === 'ACTIVE') ||
    tableSessions.find(s => s.id === currentTable.currentSessionId && s.tableId === currentTable.id) ||
    tableSessions.find(s => s.tableId === currentTable.id);

  const tableOrders = orders.filter(o => o.tableId === currentTable.id && o.status !== 'ANNULEE');
  const sessionOrderIds = activeSession?.orderIds?.length ? activeSession.orderIds : tableOrders.map(o => o.id);

  // Get all orders belonging to the current table, with a resilient fallback on the active session.
  const sessionOrders = activeSession
    ? orders.filter(o => sessionOrderIds.includes(o.id) && o.status !== 'ANNULEE')
    : tableOrders.slice(0, 4);

  const handleCallWaiter = () => {
    addNotification(`Un serveur a été notifié pour la ${currentTable.code} !`, 'info');
  };

  const handleRequestBill = () => {
    updateTableStatus(currentTable.id, 'A_PAYER');
    addNotification(`Demande d'addition envoyée à la caisse pour ${currentTable.code} !`, 'warning');
  };

  const getStepProgress = (status: OrderStatus) => {
    switch (status) {
      case 'NOUVELLE': return 1;
      case 'ACCEPTEE': return 2;
      case 'EN_PREPARATION': return 3;
      case 'PRETE': return 4;
      case 'SERVIE': return 5;
      default: return 0;
    }
  };

  const steps = [
    { step: 1, label: 'Reçue', icon: Clock, desc: 'Envoyée en cuisine' },
    { step: 2, label: 'Acceptée', icon: Sparkles, desc: 'Prise en charge' },
    { step: 3, label: 'En Préparation', icon: Flame, desc: 'Cuisson aux fourneaux' },
    { step: 4, label: 'Prête', icon: ChefHat, desc: 'Prête au passe' },
    { step: 5, label: 'Servie', icon: CheckCircle2, desc: 'Bon appétit !' },
  ];

  if (sessionOrders.length === 0) {
    return (
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 text-center text-stone-400">
        <UtensilsCrossed className="w-10 h-10 mx-auto text-stone-600 mb-2" />
        <h4 className="text-sm font-bold text-stone-300">Aucune commande en cours pour {currentTable.code}</h4>
        <p className="text-xs text-stone-500 mt-1">
          Parcourez le menu ci-dessous et composez votre commande pour lancer la préparation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl text-stone-100 space-y-4">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            {currentTable.code.replace('Table ', 'T')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-100">Suivi en direct de votre table</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {currentTable.code}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {sessionOrders.length} commande{sessionOrders.length > 1 ? 's' : ''} associée{sessionOrders.length > 1 ? 's' : ''} à votre session
            </p>
          </div>
        </div>

        {/* Action buttons (Call waiter & Request bill) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCallWaiter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>Appeler serveur</span>
          </button>
          <button
            onClick={handleRequestBill}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold border border-amber-600/40 transition"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Demander l'addition</span>
          </button>
        </div>
      </div>

      {/* Orders Steppers */}
      <div className="space-y-4">
        {sessionOrders.map(order => {
          const currentStep = getStepProgress(order.status);
          const isDone = order.status === 'SERVIE';

          return (
            <div 
              key={order.id} 
              className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 sm:p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">{order.orderNumber}</span>
                  <span className="text-[11px] text-stone-400">
                    • Passée à {formatTimeOnly(order.createdAt)}
                  </span>
                </div>
                <div className="text-xs font-extrabold font-mono text-stone-200">
                  {formatFC(order.totalAmount)}
                </div>
              </div>

              {/* Visual Progress Stepper */}
              <div className="relative py-2">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-stone-800 z-0" />
                <div 
                  className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 bg-amber-500 z-0 transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 4) * 100))}%` }}
                />

                <div className="relative z-10 flex items-center justify-between">
                  {steps.map(s => {
                    const StepIcon = s.icon;
                    const isPassed = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;

                    return (
                      <div key={s.step} className="flex flex-col items-center group">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                            isCurrent
                              ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20 scale-110'
                              : isPassed
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-800 text-stone-500 border border-stone-700'
                          }`}
                        >
                          <StepIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className={`text-[10px] mt-1 font-medium hidden sm:block ${
                          isCurrent ? 'text-amber-400 font-bold' : isPassed ? 'text-stone-300' : 'text-stone-500'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items Summary */}
              <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-2">
                <div className="truncate max-w-md">
                  {order.items.map(it => `${it.quantity}x ${it.productName}`).join(' • ')}
                </div>
                <div className="shrink-0 font-medium">
                  {order.status === 'PRETE' ? (
                    <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> En cours d'acheminement à votre table
                    </span>
                  ) : order.status === 'EN_PREPARATION' ? (
                    <span className="text-amber-300/90 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> En cuisine
                    </span>
                  ) : order.status === 'SERVIE' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Servie
                    </span>
                  ) : (
                    <span className="text-stone-400">En attente de prise en charge</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
