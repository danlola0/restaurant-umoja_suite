import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus } from '../../types';
import { formatTimeOnly, playNotificationSound } from '../../utils/formatters';
import { ServiceExpensePanel } from '../common/ServiceExpensePanel';
import { KitchenPrepPanel } from './KitchenPrepPanel';
import { KitchenStockPanel } from './KitchenStockPanel';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Filter, 
  Sparkles,
  ArrowRight,
  Utensils,
  Check,
  RotateCcw,
  Coffee
} from 'lucide-react';

export const KitchenKdsView: React.FC = () => {
  const { orders, updateOrderStatus, cancelOrder } = useRestaurant();
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update timer every 15 seconds to recalculate elapsed minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (o.status === 'ANNULEE') return false;
    if (filterStatus === 'ACTIVE') {
      return ['NOUVELLE', 'ACCEPTEE', 'EN_PREPARATION', 'PRETE'].includes(o.status);
    }
    if (filterStatus === 'NOUVELLE') return o.status === 'NOUVELLE';
    if (filterStatus === 'EN_PREPARATION') return ['ACCEPTEE', 'EN_PREPARATION'].includes(o.status);
    if (filterStatus === 'PRETE') return o.status === 'PRETE';
    if (filterStatus === 'SERVIE') return o.status === 'SERVIE';
    return true;
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Helper for elapsed minutes
  const getElapsedMinutes = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    return Math.floor((currentTime - start) / 60000);
  };

  const getUrgencyBadge = (minutes: number, status: OrderStatus) => {
    if (status === 'PRETE' || status === 'SERVIE') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {status === 'PRETE' ? 'Au Passe' : 'Servie'}
        </span>
      );
    }

    if (minutes < 10) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 flex items-center gap-1 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          {minutes} min
        </span>
      );
    } else if (minutes < 20) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/60 flex items-center gap-1 font-mono animate-pulse">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          {minutes} min
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950 text-rose-300 border border-rose-600 flex items-center gap-1 font-mono animate-bounce">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          URGENT ({minutes} min)
        </span>
      );
    }
  };

  const activeCount = orders.filter(o => ['NOUVELLE', 'ACCEPTEE', 'EN_PREPARATION'].includes(o.status)).length;
  const readyCount = orders.filter(o => o.status === 'PRETE').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* KDS Header & Controls */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ChefHat className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-extrabold text-stone-100 tracking-tight sm:text-xl">
                Écran Cuisine Umoja (KDS)
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-stone-950">
                Temps Réel
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {activeCount} commande{activeCount > 1 ? 's' : ''} en préparation • {readyCount} prête{readyCount > 1 ? 's' : ''} au passe
            </p>
          </div>
        </div>

        {/* Filter Buttons & Audio Toggle */}
        <div className="flex min-w-0 items-center gap-2">
          
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setFilterStatus('ACTIVE')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === 'ACTIVE'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              En cours ({activeCount + readyCount})
            </button>
            <button
              onClick={() => setFilterStatus('NOUVELLE')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === 'NOUVELLE'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Nouvelles ({orders.filter(o => o.status === 'NOUVELLE').length})
            </button>
            <button
              onClick={() => setFilterStatus('EN_PREPARATION')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === 'EN_PREPARATION'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Cuisson ({orders.filter(o => ['ACCEPTEE', 'EN_PREPARATION'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setFilterStatus('PRETE')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === 'PRETE'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Prêtes ({readyCount})
            </button>
            <button
              onClick={() => setFilterStatus('SERVIE')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === 'SERVIE'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Historique Servies
            </button>
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationSound('order');
            }}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-stone-800 border-stone-700 text-stone-500'
            }`}
            title={soundEnabled ? 'Alertes sonores actives' : 'Alertes sonores coupées'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

        </div>
      </div>

      <KitchenPrepPanel />
      <KitchenStockPanel />
      <ServiceExpensePanel service="CUISINE" title="Cuisine" />

      {/* Orders Tickets Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-16 text-center text-stone-500 max-w-lg mx-auto space-y-3">
          <Coffee className="w-16 h-16 mx-auto text-stone-700 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-stone-300">Aucun bon de commande en attente</h3>
          <p className="text-xs text-stone-500">
            Toutes les commandes en cuisine ont été traitées et servies avec succès.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredOrders.map(order => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isNew = order.status === 'NOUVELLE';
            const isInPrep = order.status === 'EN_PREPARATION' || order.status === 'ACCEPTEE';
            const isReady = order.status === 'PRETE';
            const isServed = order.status === 'SERVIE';

            return (
              <div
                key={order.id}
                className={`bg-stone-900 border-2 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all ${
                  isNew
                    ? 'border-amber-500 ring-4 ring-amber-500/10'
                    : isReady
                    ? 'border-emerald-500/80 bg-stone-900/90'
                    : isInPrep
                    ? 'border-amber-600/70'
                    : 'border-stone-800 opacity-75'
                }`}
              >
                {/* Ticket Header */}
                <div className={`p-4 border-b flex items-center justify-between gap-2 ${
                  isNew 
                    ? 'bg-amber-500/20 border-amber-500/30' 
                    : isReady 
                    ? 'bg-emerald-950/40 border-emerald-800/40' 
                    : 'bg-stone-950/80 border-stone-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-amber-400">
                        {order.orderNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-stone-950 text-stone-100 border border-stone-700">
                        {order.tableCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Reçue à {formatTimeOnly(order.createdAt)}
                    </div>
                  </div>

                  <div>
                    {getUrgencyBadge(elapsed, order.status)}
                  </div>
                </div>

                {/* Ticket Items List (Kitchen View: Clean & High Contrast) */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
                  
                  {/* Special order instructions if any */}
                  {order.specialInstructions && (
                    <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-2.5 text-xs text-rose-200 font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="uppercase text-[10px] text-rose-400 block font-bold">Instruction Client :</span>
                        {order.specialInstructions}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-stone-800/80">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {/* Quantity Badge in Big Bold */}
                          <span className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shrink-0 shadow">
                            {item.quantity}
                          </span>
                          <div>
                            <div className="text-sm font-extrabold text-stone-100">
                              {item.productName}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-amber-300 italic font-semibold mt-0.5 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                                ⚠ {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Big Action Buttons (Touch Friendly for Chefs) */}
                <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
                  {isNew && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ACCEPTEE')}
                        className="flex-1 py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        Accepter
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'EN_PREPARATION')}
                        className="flex-1 py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Flame className="w-4 h-4" />
                        Lancer Cuisson
                      </button>
                    </>
                  )}

                  {order.status === 'ACCEPTEE' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'EN_PREPARATION')}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Flame className="w-4 h-4" />
                      Lancer la Préparation
                    </button>
                  )}

                  {order.status === 'EN_PREPARATION' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PRETE')}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Commande Prête au Passe !
                    </button>
                  )}

                  {order.status === 'PRETE' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'SERVIE')}
                      className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider transition border border-stone-700 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Utensils className="w-4 h-4 text-emerald-400" />
                      Marquer comme Servie à Table
                    </button>
                  )}

                  {order.status === 'SERVIE' && (
                    <div className="w-full py-2 text-center text-xs font-semibold text-stone-400 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Servie à {formatTimeOnly(order.servedAt)}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
