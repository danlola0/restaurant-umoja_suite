import { Invoice, Order, PaymentMethod } from '../types';

export const WECHAT_PAY_QR_SRC = '/payments/wechat-pay.jpg';
export const ALIPAY_PAY_QR_SRC = '/payments/alipay-pay.jpg';
export const LAKALA_PAY_QR_SRC = ALIPAY_PAY_QR_SRC;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ESPECES: 'Cash / Espèces',
  M_PESA: 'M-Pesa',
  AIRTEL_MONEY: 'Airtel Money',
  ORANGE_MONEY: 'Orange Money',
  BANQUE: 'Banque / Virement',
  CARTE: 'Carte / UnionPay',
  QR_CODE: 'WeChat Pay / Alipay',
  AUTRE: 'Autre',
};

export function paymentMethodLabel(method?: PaymentMethod | string): string {
  if (!method) return 'Non réglé';
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] || method;
}

export function invoiceLineItems(invoice: Invoice, orders: Order[]): Invoice['items'] {
  if (invoice.items?.length) return invoice.items;
  const related = orders.filter(order => (invoice.orderIds || []).includes(order.id));
  const grouped = new Map<string, Invoice['items'][number]>();
  related.forEach(order => {
    order.items.forEach(item => {
      const key = `${item.productName}_${item.unitPrice}`;
      const current = grouped.get(key);
      if (current) {
        current.quantity += item.quantity;
        current.subtotal += item.subtotal;
      } else {
        grouped.set(key, {
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });
      }
    });
  });
  return Array.from(grouped.values());
}

export function invoiceGuestLabel(invoice: Invoice, orders: Order[]): string {
  const named = orders.find(order => invoice.orderIds?.includes(order.id) && order.clientName)?.clientName;
  return named || invoice.tableCode || 'Comptoir';
}

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
