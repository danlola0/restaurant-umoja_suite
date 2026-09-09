import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFC, formatDateTime } from '../../utils/formatters';
import { Utensils } from 'lucide-react';

export const ServedOrdersPanel: React.FC = () => {
  const { orders, tables, products, categories } = useRestaurant();
  const today = new Date().toISOString().slice(0, 10);
  const drinkCategoryIds = new Set(categories.filter(category => /boisson/i.test(category.name)).map(category => category.id));
  const served = orders
    .filter(order => ['SERVIE', 'PAYEE'].includes(order.status) && order.createdAt.slice(0, 10) === today)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const lineKind = (productName: string, productId: string) => {
    const product = products.find(item => item.id === productId);
    return product && drinkCategoryIds.has(product.categoryId) ? 'Boisson' : /boisson|jus|bière|biere|soda|eau/i.test(productName) ? 'Boisson' : 'Plat';
  };

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-lg">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-stone-100">
        <Utensils className="h-4 w-4 text-amber-400" /> Service du jour (commandes existantes)
      </h2>
      <p className="mb-3 text-[11px] text-stone-400">Aucune double saisie : plats, boissons et tables viennent des commandes déjà enregistrées.</p>
      <div className="space-y-2 text-xs">
        {served.map(order => (
          <div key={order.id} className="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
            <div className="flex justify-between gap-2">
              <strong>{order.orderNumber} · {tables.find(table => table.id === order.tableId)?.code || order.tableCode}</strong>
              <span className="font-mono text-amber-300">{formatFC(order.totalAmount)}</span>
            </div>
            <p className="mt-1 text-stone-400">{order.items.map(item => `${item.quantity}× ${item.productName} (${lineKind(item.productName, item.productId)})`).join(' · ')}</p>
            <p className="mt-1 text-stone-500">{formatDateTime(order.servedAt || order.createdAt)} · {order.status}</p>
          </div>
        ))}
        {served.length === 0 && <p className="py-4 text-center text-stone-500">Aucune commande servie aujourd’hui.</p>}
      </div>
    </section>
  );
};
