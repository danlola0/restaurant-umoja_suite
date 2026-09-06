import express, { type Request } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const CASHIER_ORDERS_SELECT =
  '*, order_items(*, products(id, name, price)), restaurant_tables(code, name, zone)';

const PENDING_STATUSES = ['NOUVELLE', 'ACCEPTEE', 'EN_PREPARATION', 'PRETE', 'SERVIE'];

type CashierAppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  standalone?: boolean;
};

const attachOrderItems = (ordersRows: any[], itemRows: any[]) => {
  const itemsByOrder = new Map<string, any[]>();
  itemRows.forEach(item => {
    const items = itemsByOrder.get(item.order_id) || [];
    items.push(item);
    itemsByOrder.set(item.order_id, items);
  });
  return ordersRows.map(row => ({
    ...row,
    order_items: row.order_items?.length ? row.order_items : (itemsByOrder.get(row.id) || []),
  }));
};

const mapOrder = (row: any) => {
  const nestedItems = Array.isArray(row.order_items) ? row.order_items : [];
  const embeddedTable = Array.isArray(row.restaurant_tables) ? row.restaurant_tables[0] : row.restaurant_tables;
  const items = nestedItems.map((item: any) => ({
    id: item.id,
    productId: item.product_id || item.products?.id || '',
    productName: item.product_name || item.products?.name || 'Article',
    unitPrice: Number(item.unit_price ?? item.products?.price ?? 0),
    quantity: item.quantity,
    notes: item.notes || undefined,
    subtotal: Number(item.subtotal ?? item.quantity * Number(item.unit_price || 0)),
  }));
  const computedTotal = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
  return {
    id: row.id,
    orderNumber: row.order_number,
    restaurantId: 'resto-umoja',
    tableId: row.table_id || '',
    tableCode: embeddedTable?.code || '',
    sessionId: row.table_session_id || '',
    items,
    totalAmount: Number(row.total_amount) || computedTotal,
    status: row.status,
    createdAt: row.created_at,
    preparedAt: row.prepared_at || undefined,
    servedAt: row.served_at || undefined,
    specialInstructions: row.special_instructions || undefined,
    clientName: row.client_name || undefined,
    orderType: row.order_type,
  };
};

const createUserClient = (config: CashierAppConfig, req: Request): SupabaseClient => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

async function fetchPendingOrders(client: SupabaseClient) {
  const joined = await client
    .from('orders')
    .select(CASHIER_ORDERS_SELECT)
    .in('status', PENDING_STATUSES)
    .order('created_at', { ascending: false });

  let rows = joined.data || [];
  if (joined.error || rows.some(row => !Array.isArray(row.order_items))) {
    const [plainOrders, itemsResult] = await Promise.all([
      client.from('orders').select('*').in('status', PENDING_STATUSES).order('created_at', { ascending: false }),
      client.from('order_items').select('*'),
    ]);
    if (plainOrders.error) {
      return { orders: [] as ReturnType<typeof mapOrder>[], error: joined.error?.message || plainOrders.error.message };
    }
    rows = attachOrderItems(plainOrders.data || [], itemsResult.data || []);
  }

  const [invoicesResult] = await Promise.all([
    client.from('invoices').select('order_ids, status').eq('status', 'PAYEE'),
  ]);
  const paidOrderIds = new Set(
    (invoicesResult.data || []).flatMap((invoice: any) => invoice.order_ids || [])
  );

  const orders = rows.map(mapOrder).filter(order => !paidOrderIds.has(order.id));
  return { orders, error: null as string | null };
}

export function createCashierApp(config: CashierAppConfig) {
  const app = express();
  app.use(express.json());

  if (config.standalone) {
    app.use((_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      next();
    });
    app.options('*', (_req, res) => {
      res.sendStatus(204);
    });
  }

  app.get('/api/cashier/orders', async (req, res) => {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      res.status(500).json({ error: 'Configuration Supabase manquante côté API.' });
      return;
    }
    const client = createUserClient(config, req);
    const result = await fetchPendingOrders(client);
    if (result.error) {
      res.status(500).json({ error: result.error });
      return;
    }
    res.json({ orders: result.orders });
  });

  const settlePayment = async (req: Request, res: express.Response) => {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      res.status(500).json({ error: 'Configuration Supabase manquante côté API.' });
      return;
    }
    const orderId = req.params.id;
    const paymentMethod = typeof req.body?.paymentMethod === 'string' ? req.body.paymentMethod : 'ESPECES';
    const cashierName = typeof req.body?.cashierName === 'string' ? req.body.cashierName : 'Caissier Umoja';
    const client = createUserClient(config, req);

    const { data: orderRow, error: orderError } = await client
      .from('orders')
      .select(CASHIER_ORDERS_SELECT)
      .eq('id', orderId)
      .maybeSingle();

    let row = orderRow;
    if (orderError || !row || !Array.isArray(row.order_items)) {
      const [plain, items] = await Promise.all([
        client.from('orders').select('*').eq('id', orderId).maybeSingle(),
        client.from('order_items').select('*').eq('order_id', orderId),
      ]);
      if (plain.error || !plain.data) {
        res.status(404).json({ error: orderError?.message || plain.error?.message || 'Commande introuvable.' });
        return;
      }
      row = { ...plain.data, order_items: items.data || [] };
    }

    const order = mapOrder(row);
    const now = new Date().toISOString();
    const invoiceId = `inv-${Date.now()}`;
    const invoiceNumber = `FACT-${now.slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-4)}`;

    const { error: invoiceError } = await client.from('invoices').insert({
      id: invoiceId,
      invoice_number: invoiceNumber,
      table_session_id: order.sessionId || null,
      table_id: order.tableId || null,
      table_code: order.tableCode || order.clientName || 'Comptoir',
      order_ids: [order.id],
      cashier_name: cashierName,
      subtotal: order.totalAmount,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: order.totalAmount,
      paid_amount: order.totalAmount,
      status: 'PAYEE',
      created_at: now,
      paid_at: now,
      payment_method: paymentMethod,
    });
    if (invoiceError) {
      res.status(400).json({ error: `Facture non enregistrée : ${invoiceError.message}` });
      return;
    }

    const { error: paymentError } = await client.from('payments').insert({
      id: `tx-${Date.now()}`,
      invoice_id: invoiceId,
      amount: order.totalAmount,
      payment_method: paymentMethod,
      note: 'Validation caisse',
      created_at: now,
    });
    if (paymentError) {
      res.status(400).json({ error: `Paiement non enregistré : ${paymentError.message}` });
      return;
    }

    const { error: statusError } = await client
      .from('orders')
      .update({ status: 'PAYEE', served_at: order.servedAt || now })
      .eq('id', order.id);
    if (statusError) {
      res.status(400).json({ error: `Statut commande non mis à jour : ${statusError.message}` });
      return;
    }

    if (order.tableId) {
      await client.from('restaurant_tables').update({ status: 'LIBRE' }).eq('id', order.tableId);
    }
    if (order.sessionId) {
      await client.from('table_sessions').update({
        status: 'CLOSED',
        closed_at: now,
        paid_amount: order.totalAmount,
      }).eq('id', order.sessionId);
    }

    res.json({
      success: true,
      order: { ...order, status: 'PAYEE' },
      invoiceId,
      invoiceNumber,
    });
  };

  app.post('/api/cashier/orders/:id/pay', settlePayment);
  app.patch('/api/cashier/orders/:id/pay', settlePayment);

  return app;
}
