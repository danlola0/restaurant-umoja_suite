import { supabase } from './supabase';
import { Order, PaymentMethod } from '../types';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCashierOrdersFromApi(): Promise<Order[] | null> {
  try {
    const response = await fetch('/api/cashier/orders', { headers: await authHeaders() });
    if (!response.ok) return null;
    const payload = await response.json();
    return Array.isArray(payload.orders) ? payload.orders : null;
  } catch {
    return null;
  }
}

export async function payCashierOrderViaApi(
  orderId: string,
  options: { cashierName: string; paymentMethod?: PaymentMethod }
): Promise<{ success: boolean; error?: string; invoiceNumber?: string }> {
  try {
    const response = await fetch(`/api/cashier/orders/${encodeURIComponent(orderId)}/pay`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        cashierName: options.cashierName,
        paymentMethod: options.paymentMethod || 'ESPECES',
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: payload.error || 'Paiement API refusé.' };
    }
    return { success: true, invoiceNumber: payload.invoiceNumber };
  } catch {
    return { success: false, error: 'API caissier indisponible.' };
  }
}
