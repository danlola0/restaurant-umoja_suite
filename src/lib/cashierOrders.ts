import { Invoice, Order } from '../types';

export const CASHIER_PENDING_STATUSES = ['NOUVELLE', 'ACCEPTEE', 'EN_PREPARATION', 'PRETE', 'SERVIE'] as const;

export function paidOrderIdSet(invoices: Invoice[]): Set<string> {
  return new Set(
    invoices.filter(invoice => invoice.status === 'PAYEE').flatMap(invoice => invoice.orderIds || [])
  );
}

export function isOrderAwaitingPayment(order: Order, paidOrderIds: Set<string>): boolean {
  if (order.status === 'ANNULEE' || order.status === 'PAYEE') return false;
  if (paidOrderIds.has(order.id)) return false;
  return true;
}

export function pendingCashierOrders(orders: Order[], invoices: Invoice[]): Order[] {
  const paidIds = paidOrderIdSet(invoices);
  return orders
    .filter(order => isOrderAwaitingPayment(order, paidIds))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function orderBillTotal(order: Order): number {
  const fromItems = order.items.reduce((sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity), 0);
  return fromItems || order.totalAmount;
}
