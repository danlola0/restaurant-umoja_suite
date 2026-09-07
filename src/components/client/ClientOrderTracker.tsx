import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useI18n } from '../../context/LanguageContext';
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
  const { t, translateDish } = useI18n();

  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];
  if (!currentTable) {
    return (
      <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-7 text-center text-stone-400">
        <UtensilsCrossed className="w-11 h-11 mx-auto text-stone-600 mb-3" />
        <h4 className="text-sm font-semibold text-stone-200">{t('tableArriving')}</h4>
        <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{t('tableArrivingHint')}</p>
      </div>
    );
  }

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
    { step: 1, label: t('stepReceived'), icon: Clock, desc: '' },
    { step: 2, label: t('stepAccepted'), icon: Sparkles, desc: '' },
    { step: 3, label: t('stepCooking'), icon: Flame, desc: '' },
    { step: 4, label: t('stepReady'), icon: ChefHat, desc: '' },
    { step: 5, label: t('stepServed'), icon: CheckCircle2, desc: '' },
  ];

  if (sessionOrders.length === 0) {
    return (
      <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-7 text-center text-stone-400">
        <UtensilsCrossed className="w-11 h-11 mx-auto text-stone-600 mb-3" />
        <h4 className="text-sm font-semibold text-stone-200">{t('nothingInKitchen')} {currentTable.code}</h4>
        <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
          {t('nothingHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl text-stone-100 space-y-5">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            {currentTable.code.replace('Table ', 'T')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-100">{t('liveOrder')}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {currentTable.code}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {sessionOrders.length} {t('passages')}
            </p>
          </div>
        </div>

        {/* Action buttons (Call waiter & Request bill) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCallWaiter}
            className="flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('callService')}</span>
          </button>
          <button
            onClick={handleRequestBill}
            className="flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold border border-amber-600/40 transition"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('requestBill')}</span>
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
                    • {t('placedAt')} {formatTimeOnly(order.createdAt)}
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
                  {order.items.map(it => `${it.quantity}x ${translateDish(it.productName)}`).join(' • ')}
                </div>
                <div className="shrink-0 font-medium">
                  {order.status === 'PRETE' ? (
                    <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> {t('onTheWay')}
                    </span>
                  ) : order.status === 'EN_PREPARATION' ? (
                    <span className="text-amber-300/90 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> {t('inKitchen')}
                    </span>
                  ) : order.status === 'SERVIE' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('served')}
                    </span>
                  ) : (
                    <span className="text-stone-400">{t('waiting')}</span>
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
