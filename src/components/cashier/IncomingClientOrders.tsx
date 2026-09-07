import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Invoice, Order } from '../../types';
import { formatFC, formatTimeOnly } from '../../utils/formatters';
import { fetchCashierOrdersFromApi } from '../../lib/cashierApi';
import { orderBillTotal, pendingCashierOrders } from '../../lib/cashierOrders';
import { supabase } from '../../lib/supabase';
import { CreditCard, Receipt, RefreshCw, ShoppingBag, Users } from 'lucide-react';

interface IncomingClientOrdersProps {
  onOpenInvoice: (invoice: Invoice) => void;
  onPayInvoice: (invoice: Invoice) => void;
}

const statusLabel: Record<string, string> = {
  NOUVELLE: 'Nouvelle',
  ACCEPTEE: 'Acceptée',
  EN_PREPARATION: 'En préparation',
  PRETE: 'Prête',
  SERVIE: 'Servie',
  PAYEE: 'Payée',
};

export const IncomingClientOrders: React.FC<IncomingClientOrdersProps> = ({
  onOpenInvoice,
  onPayInvoice,
}) => {
  const { orders, invoices, generateInvoiceForOrders, currentUser } = useRestaurant();
  const [apiOrders, setApiOrders] = useState<Order[] | null>(null);
  const [billingOrderId, setBillingOrderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshFromApi = async () => {
    setRefreshing(true);
    const remote = await fetchCashierOrdersFromApi();
    setApiOrders(remote);
    setRefreshing(false);
  };

  useEffect(() => {
    void refreshFromApi();
    const channel = supabase
      .channel('cashier-incoming-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        void refreshFromApi();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        void refreshFromApi();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, () => {
        void refreshFromApi();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const pending = useMemo(() => {
    const fromContext = pendingCashierOrders(orders, invoices);
    if (!apiOrders) return fromContext;
    const byId = new Map(fromContext.map(order => [order.id, order]));
    apiOrders.forEach(order => {
      const current = byId.get(order.id);
      byId.set(order.id, {
        ...current,
        ...order,
        items: order.items.length ? order.items : current?.items || [],
        tableCode: order.tableCode || current?.tableCode || '',
        clientName: order.clientName || current?.clientName,
      });
    });
    return pendingCashierOrders(Array.from(byId.values()), invoices);
  }, [apiOrders, invoices, orders]);

  const cashierName = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Caissier Umoja';

  const handleBill = (order: Order) => {
    setBillingOrderId(order.id);
    const existing = invoices.find(invoice =>
      invoice.status === 'EN_ATTENTE' && invoice.orderIds.includes(order.id)
    );
    const invoice = existing || generateInvoiceForOrders([order.id], cashierName);
    setBillingOrderId(null);
    if (!invoice) return;
    onOpenInvoice(invoice);
    onPayInvoice(invoice);
  };

  return (
    <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            Commandes clients à contrôler
          </h2>
          <p className="text-xs text-stone-400">
            Liste temps réel des commandes non payées, avec articles, quantités et total à facturer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-950 text-amber-300 border border-amber-600/50">
            {pending.length} en attente
          </span>
          <button
            type="button"
            onClick={() => void refreshFromApi()}
            className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 hover:text-white"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-8 text-center text-stone-500">
          <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-700" />
          <p className="text-sm font-medium">Aucune commande client en attente de paiement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {pending.map(order => {
            const total = orderBillTotal(order);
            return (
              <article
                key={order.id}
                className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-black text-amber-400">{order.orderNumber}</p>
                    <p className="text-sm font-semibold text-stone-100">
                      {order.tableCode || 'Comptoir'}
                      {order.clientName ? ` • ${order.clientName}` : ''}
                    </p>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" />
                      {order.orderType === 'A_EMPORTER' ? 'À emporter' : 'Sur place'} • {formatTimeOnly(order.createdAt)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-900 text-stone-300 border border-stone-700">
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>

                <ul className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                  {order.items.length === 0 ? (
                    <li className="text-stone-500">Détail des plats en cours de chargement…</li>
                  ) : (
                    order.items.map(item => (
                      <li key={item.id} className="flex justify-between gap-2 text-stone-300">
                        <span>
                          <span className="font-mono text-amber-300">{item.quantity}×</span> {item.productName}
                        </span>
                        <span className="font-mono text-stone-200">{formatFC(item.subtotal)}</span>
                      </li>
                    ))
                  )}
                </ul>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-xs text-stone-400">Total à facturer</span>
                  <span className="font-mono font-black text-lg text-amber-400">{formatFC(total)}</span>
                </div>

                <button
                  type="button"
                  disabled={billingOrderId === order.id}
                  onClick={() => handleBill(order)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CreditCard className="w-4 h-4" />
                  Facturer / Valider le paiement
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
