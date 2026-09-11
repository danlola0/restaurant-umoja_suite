import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDateTime, formatFC } from '../../utils/formatters';
import { periodRange } from '../../utils/profitability';
import { Utensils } from 'lucide-react';

export const ServedOrdersPanel: React.FC = () => {
  const { orders, tables } = useRestaurant();
  const range = periodRange('TODAY');
  const served = orders
    .filter(order => ['SERVIE', 'PAYEE'].includes(order.status) && new Date(order.servedAt || order.createdAt).getTime() >= range.start.getTime() && new Date(order.servedAt || order.createdAt).getTime() <= range.end.getTime())
    .sort((a, b) => (b.servedAt || b.createdAt).localeCompare(a.servedAt || a.createdAt));

  const lines = served.flatMap(order => order.items.map(item => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    table: tables.find(table => table.id === order.tableId)?.code || order.tableCode,
    date: order.servedAt || order.createdAt,
    productName: item.productName,
    quantity: item.quantity,
    subtotal: item.subtotal,
  })));
  const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-lg">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold text-stone-100">
        <Utensils className="h-4 w-4 text-amber-400" /> Rapport de service du jour
      </h2>
      <p className="mb-3 text-[11px] text-stone-400">Plats servis depuis les commandes existantes. {totalQty} pièce{totalQty > 1 ? 's' : ''} · {served.length} commande{served.length > 1 ? 's' : ''}.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-300">
          <thead className="font-mono text-[10px] uppercase text-stone-500">
            <tr>
              <th className="py-2 pr-2">Date</th>
              <th className="py-2 pr-2">Plat</th>
              <th className="py-2 pr-2">Qté</th>
              <th className="py-2 pr-2">Table</th>
              <th className="py-2">Commande</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {lines.map((line, index) => (
              <tr key={`${line.orderId}-${index}`}>
                <td className="py-2 pr-2 text-stone-400">{formatDateTime(line.date)}</td>
                <td className="py-2 pr-2 font-semibold text-stone-100">{line.productName}</td>
                <td className="py-2 pr-2 font-mono text-amber-300">{line.quantity}</td>
                <td className="py-2 pr-2">{line.table}</td>
                <td className="py-2 font-mono">{line.orderNumber}</td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-stone-500">Aucun plat servi aujourd’hui.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {served.length > 0 && (
        <p className="mt-3 text-right font-mono text-xs text-amber-300">Total service : {formatFC(served.reduce((sum, order) => sum + order.totalAmount, 0))}</p>
      )}
    </section>
  );
};
