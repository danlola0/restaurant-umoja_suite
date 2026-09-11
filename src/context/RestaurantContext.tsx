import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserRole,
  Employee,
  RestaurantInfo,
  Category,
  Product,
  Ingredient,
  RecipeIngredient,
  KitchenPreparation,
  StockMovement,
  SalaryPayment,
  RestaurantTable,
  Order,
  OrderStatus,
  TableSession,
  Invoice,
  PaymentTransaction,
  PaymentMethod,
  AttendanceRecord,
  AttendanceType,
  AttendanceStatus,
  ExpenseCategory,
  Expense,
  CashRegisterSession,
  AuditLog,
} from '../types';

import {
  initialRestaurantInfo,
  initialCategories,
  initialProducts,
  initialTables,
  initialEmployees,
  initialExpenseCategories,
  initialOrders,
  initialTableSessions,
  initialAttendanceRecords,
  initialExpenses,
  initialCashRegisterSession,
  initialInvoices,
  initialAuditLogs,
} from '../data/seedData';
import { isLocalCalendarDay, localCalendarDate, playNotificationSound } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { isPurchaseCategory } from '../utils/expenseCatalog';
import { findIngredientByName } from '../utils/profitability';

interface NotificationItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface RestaurantContextType {
  // State
  currentRole: UserRole;
  currentUser: Employee | null;
  authLoading: boolean;
  authEmail: string | null;
  selectedTableId: string;
  restaurantInfo: RestaurantInfo;
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  recipeIngredients: RecipeIngredient[];
  kitchenPreparations: KitchenPreparation[];
  stockMovements: StockMovement[];
  salaryPayments: SalaryPayment[];
  tables: RestaurantTable[];
  orders: Order[];
  tableSessions: TableSession[];
  invoices: Invoice[];
  paymentTransactions: PaymentTransaction[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  cashRegister: CashRegisterSession;
  cashClosuresHistory: CashRegisterSession[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];

  // Role & Navigation
  setCurrentRole: (role: UserRole) => void;
  setCurrentUser: (user: Employee | null) => void;
  switchRole: (role: UserRole, user?: Employee | null) => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  signOut: () => Promise<void>;
  setSelectedTableId: (tableId: string) => void;

  // Orders & KDS
  placeClientOrder: (
    tableId: string, 
    items: { product: Product; quantity: number; notes?: string }[], 
    clientName?: string, 
    specialInstructions?: string
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  cancelOrder: (orderId: string, reason?: string) => void;

  // Tables & Sessions
  openTableSession: (tableId: string, customerCount: number, waiterName?: string) => Promise<TableSession>;
  updateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  addTable: (table: Omit<RestaurantTable, 'id'>) => void;
  updateTable: (id: string, updates: Partial<RestaurantTable>) => void;
  deleteTable: (id: string) => void;

  // Invoices & Payments (Cashier)
  generateInvoiceForTable: (tableId: string, cashierName: string, discountAmount?: number) => Invoice | null;
  generateInvoiceForOrders: (orderIds: string[], cashierName: string, discountAmount?: number) => Invoice | null;
  recordPayment: (
    invoiceId: string, 
    amountPaid: number, 
    method: PaymentMethod, 
    reference?: string, 
    note?: string
  ) => Promise<{ success: boolean; isFullyPaid: boolean; remaining: number }>;
  cancelPaidSale: (invoiceId: string) => Promise<boolean>;

  // Menu & Products
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;
  addIngredient: (name: string, unit: string, unitCost: number, extras?: { category?: string; stockQty?: number; minStock?: number }) => Promise<boolean>;
  setRecipeIngredient: (productId: string, ingredientId: string, quantity: number) => Promise<boolean>;
  removeRecipeIngredient: (recipeIngredientId: string) => Promise<boolean>;
  recordKitchenPreparation: (productId: string, quantity: number, notes?: string) => Promise<boolean>;
  applyStockMovement: (input: { ingredientId?: string; name: string; category?: string; unit: string; quantity: number; type: 'ENTREE' | 'SORTIE'; reason: string; unitCost?: number; notify?: boolean }) => Promise<{ ok: boolean; remaining: number; name: string }>;
  updateStockItem: (id: string, updates: { minStock?: number; category?: string }) => Promise<boolean>;
  payEmployeeSalary: (employeeId: string, periodMonth: string, confirmDuplicate?: boolean, occurredAt?: string) => Promise<boolean>;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Staff & Attendance
  addEmployee: (emp: Omit<Employee, 'id' | 'matricule'>) => void;
  createStaffAccount: (data: { email: string; password: string; role: UserRole; employee: Omit<Employee, 'id' | 'matricule' | 'auth_user_id'> }) => Promise<{ success: boolean; message: string }>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<void>;
  clockCurrentUserAttendance: (
    pin: string,
    type: AttendanceType
  ) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  correctAttendance: (recordId: string, newStatus: AttendanceStatus, reason: string, adminName: string) => void;

  // Expenses
  recordExpense: (data: Omit<Expense, 'id' | 'createdAt'> & { createdAt?: string }) => Promise<boolean>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  addExpenseCategory: (name: string, iconName?: string) => Promise<boolean>;

  // Cash Register
  openCashRegister: (openingBalance: number, openedBy: string) => void;
  closeCashRegister: (realCount: number, justification: string, closedBy: string, notes?: string) => CashRegisterSession;

  // Info & Notifications
  updateRestaurantInfo: (info: Partial<RestaurantInfo>) => void;
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
  resetToInitialData: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'umoja_resto_';

type SupabaseProductRow = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  photo: string;
  available: boolean;
  is_recommended: boolean;
  display_order: number;
  preparation_time_minutes: number;
  spicy_level: number;
  tags: string[];
};

const productFromSupabase = (row: SupabaseProductRow): Product => {
  const historicalProduct = initialProducts.find(product => product.id === row.id);
  return {
    id: row.id,
    categoryId: row.category_id || '',
    name: row.name,
    description: row.description,
    price: Number(row.price),
    photo: row.photo?.trim() || historicalProduct?.photo || '',
    available: row.available,
    isRecommended: row.is_recommended,
    order: row.display_order,
    preparationTimeMinutes: row.preparation_time_minutes,
    spicyLevel: row.spicy_level,
    tags: row.tags || [],
  };
};

const productToSupabase = (product: Product) => ({
  id: product.id,
  category_id: product.categoryId || null,
  name: product.name,
  description: product.description,
  price: product.price,
  photo: product.photo,
  available: product.available,
  is_recommended: product.isRecommended,
  display_order: product.order,
  preparation_time_minutes: product.preparationTimeMinutes,
  spicy_level: product.spicyLevel || 0,
  tags: product.tags || [],
});

const expenseFromSupabase = (row: any): Expense => ({
  id: row.id,
  date: String(row.expense_date || '').slice(0, 10),
  service: row.service || 'ADMINISTRATION',
  category: row.category,
  itemName: row.item_name || undefined,
  quantity: row.quantity === null || row.quantity === undefined ? undefined : Number(row.quantity),
  unit: row.unit || row.reference || undefined,
  description: row.description,
  amount: Number(row.amount),
  paymentMethod: row.payment_method,
  supplier: row.supplier || undefined,
  reference: row.reference || undefined,
  recordedBy: row.recorded_by || 'Utilisateur autorisé',
  createdAt: row.created_at,
});

const expenseQuantityOrNull = (quantity?: number) =>
  typeof quantity === 'number' && quantity > 0 ? quantity : null;

const persistExpenseUpdate = async (id: string, payload: Record<string, unknown>) => {
  const current = { ...payload };
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase.from('expenses').update(current).eq('id', id).select('id');
    if (!error) {
      if (!data?.length) return { ok: false, message: 'Aucune ligne modifiée dans Supabase (droits ou identifiant).' };
      return { ok: true };
    }
    if (/unit/i.test(error.message)) delete current.unit;
    else if (/created_at/i.test(error.message)) delete current.created_at;
    else if (/item_name/i.test(error.message)) delete current.item_name;
    else if (/quantity/i.test(error.message)) delete current.quantity;
    else if (/expense_date/i.test(error.message)) delete current.expense_date;
    else return { ok: false, message: error.message };
  }
  return { ok: false, message: 'Mise à jour impossible dans Supabase.' };
};

const fetchAllExpenseRows = async (service?: 'CUISINE' | 'CAISSE' | 'ADMINISTRATION') => {
  const pageSize = 1000;
  const rows: any[] = [];
  for (let from = 0; from < 50000; from += pageSize) {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (service) query = query.eq('service', service);
    const { data, error } = await query;
    if (error) return { data: rows, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
};

const ingredientFromSupabase = (row: any): Ingredient => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  unitCost: Number(row.unit_cost),
  lastExpenseId: row.last_expense_id || undefined,
  category: row.category || 'Divers',
  stockQty: Number(row.stock_qty || 0),
  minStock: Number(row.min_stock || 0),
});

const employeeFromSupabase = (row: any): Employee => ({
  id: row.id,
  auth_user_id: row.auth_user_id || undefined,
  matricule: row.matricule,
  nom: row.nom,
  postnom: row.postnom || undefined,
  prenom: row.prenom,
  telephone: row.telephone || '',
  email: row.email || undefined,
  role: row.role || undefined,
  poste: row.poste,
  salaire: Number(row.salaire),
  salaireBase: Number(row.salaire_base ?? row.salaire),
  dateEmbauche: row.date_embauche,
  typeContrat: row.type_contrat,
  statut: row.statut,
  photo: row.photo || '',
  pin: row.pin,
  scheduledShiftStart: row.scheduled_shift_start?.slice(0, 5) || '08:00',
  scheduledShiftEnd: row.scheduled_shift_end?.slice(0, 5) || '17:00',
});

const employeeToSupabase = (employee: Employee) => ({
  id: employee.id,
  auth_user_id: employee.auth_user_id || null,
  matricule: employee.matricule,
  nom: employee.nom,
  postnom: employee.postnom || null,
  prenom: employee.prenom,
  telephone: employee.telephone,
  email: employee.email || null,
  role: employee.role || null,
  poste: employee.poste,
  salaire: employee.salaire,
  salaire_base: employee.salaireBase ?? employee.salaire,
  date_embauche: employee.dateEmbauche,
  type_contrat: employee.typeContrat,
  statut: employee.statut,
  photo: employee.photo,
  pin: employee.pin,
  scheduled_shift_start: employee.scheduledShiftStart,
  scheduled_shift_end: employee.scheduledShiftEnd,
});

const tableFromSupabase = (row: any): RestaurantTable => ({
  id: row.id,
  code: row.code,
  name: row.name,
  zone: row.zone,
  capacity: Number(row.capacity),
  status: row.status,
  waiterName: row.waiter_name || undefined,
});

const CASHIER_ORDERS_SELECT = '*, order_items(*, products(id, name, price)), restaurant_tables(code, name, zone)';

const mapOrderFromSupabase = (row: any, tableCodeById: Map<string, string>): Order => {
  const nestedItems = Array.isArray(row.order_items) ? row.order_items : [];
  const embeddedTable = Array.isArray(row.restaurant_tables) ? row.restaurant_tables[0] : row.restaurant_tables;
  return {
    id: row.id,
    orderNumber: row.order_number,
    restaurantId: 'resto-umoja',
    tableId: row.table_id || '',
    tableCode: embeddedTable?.code || tableCodeById.get(row.table_id) || '',
    sessionId: row.table_session_id || '',
    items: nestedItems.map((item: any) => ({
      id: item.id,
      productId: item.product_id || item.products?.id || '',
      productName: item.product_name || item.products?.name || 'Article',
      unitPrice: Number(item.unit_price ?? item.products?.price ?? 0),
      quantity: item.quantity,
      notes: item.notes || undefined,
      subtotal: Number(item.subtotal ?? item.quantity * Number(item.unit_price || 0)),
    })),
    totalAmount: Number(row.total_amount),
    status: row.status,
    createdAt: row.created_at,
    preparedAt: row.prepared_at || undefined,
    servedAt: row.served_at || undefined,
    specialInstructions: row.special_instructions || undefined,
    clientName: row.client_name || undefined,
    orderType: row.order_type,
  };
};

const attachOrderItems = (ordersRows: any[], itemRows: any[]) => {
  const itemsByOrder = new Map<string, any[]>();
  itemRows.forEach(item => {
    const items = itemsByOrder.get(item.order_id) || [];
    items.push(item);
    itemsByOrder.set(item.order_id, items);
  });
  return ordersRows.map(row => ({ ...row, order_items: row.order_items?.length ? row.order_items : (itemsByOrder.get(row.id) || []) }));
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global states
  const [currentRole, setCurrentRole] = useState<UserRole>('CLIENT');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>('tbl-05');

  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(() => {
    const stored = loadFromStorage('info', initialRestaurantInfo);
    if (!stored.address?.includes('广州市') || stored.name !== initialRestaurantInfo.name) {
      return initialRestaurantInfo;
    }
    return stored;
  });

  const [categories, setCategories] = useState<Category[]>(() => 
    loadFromStorage('categories', initialCategories)
  );

  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = loadFromStorage<Product[]>('products', initialProducts);
    return loaded.map(p => {
      const initialMatch = initialProducts.find(ip => ip.id === p.id);
      if (initialMatch) {
        // Upgrade any broken or old default unsplash links for frites or water or missing photos
        if (
          !p.photo || 
          p.photo.includes('1576107232684-1279f3908594') || 
          p.photo.includes('1548839140-29a749e1bc4e')
        ) {
          return { ...p, photo: initialMatch.photo };
        }
      }
      return p;
    });
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [kitchenPreparations, setKitchenPreparations] = useState<KitchenPreparation[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);

  const [tables, setTables] = useState<RestaurantTable[]>(() => 
    loadFromStorage('tables', initialTables)
  );

  const [orders, setOrders] = useState<Order[]>(() => 
    loadFromStorage('orders', initialOrders)
  );

  const [tableSessions, setTableSessions] = useState<TableSession[]>(() => 
    loadFromStorage('tableSessions', initialTableSessions)
  );

  const [invoices, setInvoices] = useState<Invoice[]>(() => 
    loadFromStorage('invoices', initialInvoices)
  );

  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(() => 
    loadFromStorage('paymentTransactions', [])
  );

  const [employees, setEmployees] = useState<Employee[]>(() => 
    loadFromStorage('employees', initialEmployees)
  );

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => 
    loadFromStorage('attendanceRecords', initialAttendanceRecords)
  );

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => 
    loadFromStorage('expenseCategories', initialExpenseCategories)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() => 
    loadFromStorage('expenses', initialExpenses)
  );

  const [cashRegister, setCashRegister] = useState<CashRegisterSession>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: 'cash-register-loading',
      date: today,
      openedAt: new Date().toISOString(),
      openingBalance: 0,
      openedBy: 'Chargement...',
      status: 'CLOSED',
      totalSalesCash: 0,
      totalSalesMobile: 0,
      totalSalesCard: 0,
      totalSalesBank: 0,
      totalExpenses: 0,
      theoreticalBalance: 0,
    };
  });

  const [cashClosuresHistory, setCashClosuresHistory] = useState<CashRegisterSession[]>(() => 
    loadFromStorage('cashClosuresHistory', [])
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => 
    loadFromStorage('auditLogs', initialAuditLogs)
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const productsLoadedFromSupabase = useRef(false);
  const adminDataLoaded = useRef(false);

  // Supabase Auth is the source of truth for access; localStorage is not used for identity.
  useEffect(() => {
    let mounted = true;

    const loadAuthenticatedProfile = async (userId: string, email?: string | null) => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();

      if (!mounted) return;
      if (error || !profile) {
        setCurrentRole('CLIENT');
        setCurrentUser(null);
        setAuthEmail(email || null);
        return;
      }

      const role = profile.role as UserRole;
      const { data: employeeRow } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      if (!mounted) return;
      const linkedEmployee = employeeRow
        ? employeeFromSupabase(employeeRow)
        : null;
      if (linkedEmployee) {
        setEmployees(previous => [linkedEmployee, ...previous.filter(employee => employee.id !== linkedEmployee.id)]);
      }
      setCurrentRole(role);
      setCurrentUser(linkedEmployee);
      setAuthEmail(email || null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void loadAuthenticatedProfile(session.user.id, session.user.email).finally(() => {
          if (mounted) setAuthLoading(false);
        });
      } else if (mounted) {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setCurrentRole('CLIENT');
        setCurrentUser(null);
        setAuthEmail(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      void loadAuthenticatedProfile(session.user.id, session.user.email).finally(() => {
        if (mounted) setAuthLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authEmail || !['CAISSIER', 'ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole)) return;
    let mounted = true;

    const loadCashierData = async () => {
      const [invoicesResult, paymentsResult, expensesResult, sessionsResult] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        fetchAllExpenseRows(),
        supabase.from('cash_register_sessions').select('*').order('opened_at', { ascending: false }).limit(1),
      ]);
      if (!mounted) return;
      const error = invoicesResult.error || paymentsResult.error || expensesResult.error || sessionsResult.error;
      if (error) {
        console.error(`Données de caisse non chargées : ${error.message}`);
        return;
      }

      const invoicesFromDatabase: Invoice[] = (invoicesResult.data || []).map((row: any) => {
        const orderIds = row.order_ids || [];
        const items = orders.filter(order => orderIds.includes(order.id)).flatMap(order => order.items).reduce<Invoice['items']>((grouped, item) => {
          const existing = grouped.find(group => group.productName === item.productName && group.unitPrice === item.unitPrice);
          if (existing) {
            existing.quantity += item.quantity;
            existing.subtotal += item.subtotal;
          } else grouped.push({ productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal });
          return grouped;
        }, []);
        return { id: row.id, invoiceNumber: row.invoice_number, sessionId: row.table_session_id || '', tableId: row.table_id || '', tableCode: row.table_code || '', orderIds, items, subtotal: Number(row.subtotal), discountAmount: Number(row.discount_amount), taxAmount: Number(row.tax_amount), totalAmount: Number(row.total_amount), paidAmount: Number(row.paid_amount), remainingAmount: Math.max(0, Number(row.total_amount) - Number(row.paid_amount)), status: row.status, createdAt: row.created_at, paidAt: row.paid_at || undefined, cashierName: row.cashier_name || '', paymentMethod: row.payment_method || undefined, paymentReference: row.payment_reference || undefined };
      });
      const paymentsFromDatabase: PaymentTransaction[] = (paymentsResult.data || []).map((row: any) => {
        const invoice = invoicesFromDatabase.find(item => item.id === row.invoice_id);
        return { id: row.id, invoiceId: row.invoice_id, tableId: invoice?.tableId || '', tableCode: invoice?.tableCode || '', amount: Number(row.amount), paymentMethod: row.payment_method, reference: row.reference || undefined, note: row.note || undefined, createdAt: row.created_at, cashierName: invoice?.cashierName || 'Caissier' };
      });
      setInvoices(invoicesFromDatabase);
      setPaymentTransactions(paymentsFromDatabase);

      const today = localCalendarDate();
      const paymentsToday = paymentsFromDatabase.filter(payment => isLocalCalendarDay(payment.createdAt, today));
      const salesFor = (methods: PaymentMethod[]) => paymentsToday.filter(payment => methods.includes(payment.paymentMethod)).reduce((sum, payment) => sum + payment.amount, 0);
      if (expensesResult.data) setExpenses(expensesResult.data.map(expenseFromSupabase));
      const expensesToday = (expensesResult.data || []).filter((expense: any) => (expense.expense_date === today || isLocalCalendarDay(expense.created_at, today)) && expense.payment_method === 'ESPECES').reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
      const session = sessionsResult.data?.[0];
      const cashSales = salesFor(['ESPECES']);
      const mobileSales = salesFor(['WECHAT', 'ALIPAY', 'QR_CODE']);
      const cardSales = salesFor(['CARTE']);
      const bankSales = salesFor(['BANQUE']);
      if (session) {
        const sessionOpenedToday = isLocalCalendarDay(session.opened_at, today);
        const opening = session.status === 'OPEN' && sessionOpenedToday ? Number(session.opening_balance) : (sessionOpenedToday ? Number(session.opening_balance) : 0);
        setCashRegister({ id: session.id, date: today, openedAt: session.opened_at, openingBalance: Number(session.opening_balance), openedBy: session.opened_by || 'Caissier', status: session.status, closedAt: session.closed_at || undefined, closedBy: session.closed_by || undefined, totalSalesCash: cashSales, totalSalesMobile: mobileSales, totalSalesCard: cardSales, totalSalesBank: bankSales, totalExpenses: expensesToday, theoreticalBalance: opening + cashSales - (sessionOpenedToday ? expensesToday : 0), realBalance: session.real_balance === null ? undefined : Number(session.real_balance), variance: session.variance === null ? undefined : Number(session.variance), varianceReason: session.variance_reason || undefined, notes: session.notes || undefined });
      } else {
        setCashRegister({
          id: 'cash-register-not-opened',
          date: today,
          openedAt: new Date().toISOString(),
          openingBalance: 0,
          openedBy: 'Non ouverte',
          status: 'CLOSED',
          totalSalesCash: cashSales,
          totalSalesMobile: mobileSales,
          totalSalesCard: cardSales,
          totalSalesBank: bankSales,
          totalExpenses: expensesToday,
          theoreticalBalance: cashSales,
        });
      }
    };

    void loadCashierData();
    return () => { mounted = false; };
  }, [authEmail, currentRole, orders]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setAuthLoading(false);
      return { success: false, message: error?.message || 'Connexion refusée.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    if (profileError || !profile) {
      await supabase.auth.signOut();
      setAuthLoading(false);
      return { success: false, message: 'Profil utilisateur introuvable.' };
    }

    return { success: true, message: 'Connexion réussie.', role: profile.role as UserRole };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Purge les données sensibles conservées côté navigateur sur une machine partagée.
    const sensitiveKeys = ['employees', 'attendanceRecords', 'expenses', 'invoices', 'paymentTransactions', 'cashRegister', 'cashClosuresHistory', 'auditLogs'];
    sensitiveKeys.forEach(key => localStorage.removeItem(STORAGE_KEY_PREFIX + key));
    sessionStorage.clear();
    setCurrentRole('CLIENT');
    setCurrentUser(null);
    setAuthEmail(null);
    addNotification('Vous avez été déconnecté avec succès.', 'success');
    // Rechargement complet : aucun état React de la session précédente ne persiste.
    window.location.assign('/menu');
  }, []);

  const createStaffAccount = useCallback(async (data: { email: string; password: string; role: UserRole; employee: Omit<Employee, 'id' | 'matricule' | 'auth_user_id'> }) => {
    const { data: result, error } = await supabase.functions.invoke('create-staff-user', {
      body: {
        email: data.email,
        password: data.password,
        role: data.role,
        full_name: `${data.employee.prenom} ${data.employee.nom}`,
        employee: { ...data.employee, email: data.email, salaire: data.employee.salaireBase || data.employee.salaire },
      },
    });
    if (error || !result?.success) return { success: false, message: result?.error || error?.message || 'Création du compte impossible.' };
    const { data: employee, error: employeeError } = await supabase.from('employees').select('*').eq('id', result.employeeId).single();
    if (employeeError || !employee) return { success: false, message: 'Compte créé, mais le profil employé ne peut pas être rechargé.' };
    const newEmployee = employeeFromSupabase(employee);
    setEmployees(previous => [newEmployee, ...previous.filter(existing => existing.id !== newEmployee.id)]);
    return { success: true, message: `Compte créé. Matricule : ${result.matricule}` };
  }, []);

  // Sync to local storage
  useEffect(() => { saveToStorage('info', restaurantInfo); }, [restaurantInfo]);
  useEffect(() => { saveToStorage('categories', categories); }, [categories]);
  useEffect(() => { saveToStorage('products', products); }, [products]);
  useEffect(() => { saveToStorage('tables', tables); }, [tables]);
  useEffect(() => { saveToStorage('orders', orders); }, [orders]);
  useEffect(() => { saveToStorage('tableSessions', tableSessions); }, [tableSessions]);
  useEffect(() => { saveToStorage('invoices', invoices); }, [invoices]);
  useEffect(() => { saveToStorage('paymentTransactions', paymentTransactions); }, [paymentTransactions]);
  useEffect(() => { saveToStorage('employees', employees); }, [employees]);
  useEffect(() => { saveToStorage('attendanceRecords', attendanceRecords); }, [attendanceRecords]);
  useEffect(() => { saveToStorage('expenseCategories', expenseCategories); }, [expenseCategories]);
  useEffect(() => { saveToStorage('expenses', expenses); }, [expenses]);
  useEffect(() => { saveToStorage('cashRegister', cashRegister); }, [cashRegister]);
  useEffect(() => { saveToStorage('cashClosuresHistory', cashClosuresHistory); }, [cashClosuresHistory]);
  useEffect(() => { saveToStorage('auditLogs', auditLogs); }, [auditLogs]);

  // Role switcher helper
  const switchRole = useCallback((role: UserRole, user?: Employee | null) => {
    setCurrentRole(role);
    if (user !== undefined) {
      setCurrentUser(user);
    }
  }, []);

  // Notifications helper
  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setNotifications(prev => [
      { id, message, type, timestamp: Date.now() },
      ...prev.slice(0, 7)
    ]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (productsLoadedFromSupabase.current) return;
    productsLoadedFromSupabase.current = true;

    const loadProducts = async () => {
      let categoriesError: { message: string } | null = null;
      if (authEmail && ['ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole)) {
        const result = await supabase.from('categories').upsert(
          categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description || null,
            icon_name: category.iconName,
            display_order: category.order,
            active: category.active,
          })),
          { onConflict: 'id' }
        );
        categoriesError = result.error;
      }
      const { data, error } = await supabase.from('products').select('*').order('display_order');
      if (error) {
        productsLoadedFromSupabase.current = false;
        addNotification(`Impossible de charger les produits Supabase : ${error.message}`, 'error');
        return;
      }
      if (categoriesError) addNotification(`Catégories non synchronisées : ${categoriesError.message}`, 'warning');
      if (data && data.length > 0) {
        const productRows = data as SupabaseProductRow[];
        const loadedProducts = productRows.map(productFromSupabase);
        const productsMissingPhoto = productRows
          .filter(row => !row.photo?.trim() && initialProducts.some(product => product.id === row.id && product.photo))
          .map(productFromSupabase);

        if (authEmail && ['ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole) && productsMissingPhoto.length > 0) {
          const updates = await Promise.all(productsMissingPhoto.map(product =>
            supabase.from('products').update({ photo: product.photo }).eq('id', product.id)
          ));
          const failedUpdate = updates.find(result => result.error);
          if (failedUpdate?.error) addNotification(`Images produits non synchronisées : ${failedUpdate.error.message}`, 'warning');
        }

        setProducts(loadedProducts);
      } else if (authEmail && ['ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole)) {
        const { error: seedError } = await supabase.from('products').upsert(products.map(productToSupabase), { onConflict: 'id' });
        if (seedError) {
          productsLoadedFromSupabase.current = false;
          addNotification(`Produits initiaux non synchronisés : ${seedError.message}`, 'warning');
        }
      }
    };

    void loadProducts();
  }, [authEmail, currentRole, categories, addNotification]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let mounted = true;
    const loadOwnAttendance = async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(80);
      if (!mounted) return;
      if (error) {
        try {
          const raw = localStorage.getItem('umoja_attendance_fallback_v1');
          if (!raw) return;
          const stored = JSON.parse(raw) as AttendanceRecord[];
          setAttendanceRecords(previous => {
            const byId = new Map<string, AttendanceRecord>(previous.map(record => [record.id, record]));
            stored.filter(record => record.employeeId === currentUser.id).forEach(record => byId.set(record.id, record));
            return Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
          });
        } catch {
          /* ignore */
        }
        return;
      }
      const mapped: AttendanceRecord[] = (data || []).map((row: any) => ({
        id: row.id,
        employeeId: row.employee_id,
        matricule: currentUser.matricule,
        employeeName: `${currentUser.prenom} ${currentUser.nom}`,
        employeePhoto: currentUser.photo,
        employeePosition: currentUser.poste,
        date: row.date,
        time: row.time,
        type: row.type,
        timestamp: new Date(row.created_at).getTime(),
        scheduledTime: currentUser.scheduledShiftStart || '',
        delayMinutes: row.delay_minutes,
        status: row.status,
        isManualCorrection: row.is_manual_correction,
        correctionReason: row.correction_reason,
      }));
      setAttendanceRecords(previous => {
        const byId = new Map<string, AttendanceRecord>(previous.map(record => [record.id, record]));
        mapped.forEach(record => byId.set(record.id, record));
        return Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
      });
    };
    void loadOwnAttendance();
    return () => { mounted = false; };
  }, [currentUser]);

  useEffect(() => {
    let mounted = true;

    const refreshOperationalData = async () => {
      const [tablesResult, sessionsResult, joinedOrdersResult, invoicesResult, attendanceResult] = await Promise.all([
        supabase.from('restaurant_tables').select('*').order('code'),
        supabase.from('table_sessions').select('*').order('opened_at', { ascending: false }).limit(300),
        supabase.from('orders').select(CASHIER_ORDERS_SELECT).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(400),
        supabase.from('attendance_records').select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      if (!mounted) return;

      if (tablesResult.error) console.error('Tables non chargées :', tablesResult.error.message);
      if (sessionsResult.error) console.error('Sessions non chargées :', sessionsResult.error.message);
      if (joinedOrdersResult.error) console.error('Commandes (jointure) :', joinedOrdersResult.error.message);

      let orderRows = joinedOrdersResult.data || [];
      if (joinedOrdersResult.error || orderRows.some(row => !Array.isArray(row.order_items))) {
        const [plainOrders, itemsResult] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('order_items').select('*'),
        ]);
        if (plainOrders.error) {
          console.error('Commandes non chargées :', plainOrders.error.message);
        } else {
          orderRows = attachOrderItems(plainOrders.data || [], itemsResult.data || []);
        }
      }

      const persistedTables = tablesResult.data || [];
      const tableCodeById = new Map(persistedTables.map((table: any) => [table.id, table.code]));
      const mappedOrders = orderRows.map(row => mapOrderFromSupabase(row, tableCodeById));
      if (tablesResult.data) setTables(persistedTables.map(tableFromSupabase));
      if (sessionsResult.data) {
        setTableSessions(sessionsResult.data.map((row: any) => ({
          id: row.id,
          tableId: row.table_id,
          tableCode: tableCodeById.get(row.table_id) || row.table_id,
          openedAt: row.opened_at,
          closedAt: row.closed_at || undefined,
          status: row.status,
          orderIds: mappedOrders.filter(order => order.sessionId === row.id).map(order => order.id),
          totalAmount: Number(row.total_amount),
          paidAmount: Number(row.paid_amount),
          customerCount: row.customer_count,
        })));
      }
      if (mappedOrders.length || !joinedOrdersResult.error) {
        setOrders(mappedOrders);
      }
      if (invoicesResult.data) {
        setInvoices(invoicesResult.data.map((row: any) => ({
          id: row.id,
          invoiceNumber: row.invoice_number,
          sessionId: row.table_session_id || '',
          tableId: row.table_id || '',
          tableCode: row.table_code || '',
          orderIds: row.order_ids || [],
          items: [],
          subtotal: Number(row.subtotal),
          discountAmount: Number(row.discount_amount),
          taxAmount: Number(row.tax_amount),
          totalAmount: Number(row.total_amount),
          paidAmount: Number(row.paid_amount),
          remainingAmount: Math.max(0, Number(row.total_amount) - Number(row.paid_amount)),
          status: row.status,
          createdAt: row.created_at,
          paidAt: row.paid_at || undefined,
          cashierName: row.cashier_name || '',
          paymentMethod: row.payment_method || undefined,
          paymentReference: row.payment_reference || undefined,
        })));
      }
      if (attendanceResult.data) {
        setAttendanceRecords(previous => {
          const byId = new Map<string, AttendanceRecord>(previous.map(record => [record.id, record]));
          (attendanceResult.data as any[]).forEach(row => {
            const existing = byId.get(row.id);
            byId.set(row.id, {
              id: row.id,
              employeeId: row.employee_id,
              matricule: existing?.matricule || '',
              employeeName: existing?.employeeName || 'Employé',
              employeePhoto: existing?.employeePhoto || '',
              employeePosition: existing?.employeePosition || '',
              date: row.date,
              time: row.time,
              type: row.type,
              timestamp: new Date(row.created_at).getTime(),
              scheduledTime: existing?.scheduledTime || '',
              delayMinutes: row.delay_minutes,
              status: row.status,
              isManualCorrection: row.is_manual_correction,
              correctionReason: row.correction_reason,
            });
          });
          return Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
        });
      }
    };

    void refreshOperationalData();
    const channel = supabase.channel('umoja-operational-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, refreshOperationalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, refreshOperationalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refreshOperationalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, refreshOperationalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, refreshOperationalData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').order('display_order');
        if (!mounted || !data) return;
        setProducts((data as SupabaseProductRow[]).map(productFromSupabase));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, refreshOperationalData)
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (adminDataLoaded.current || !authEmail || !['ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole)) return;
    adminDataLoaded.current = true;

    const loadAdminData = async () => {
      const [
        categoriesResult,
        productsResult,
        tablesResult,
        sessionsResult,
        ordersResult,
        orderItemsResult,
        employeesResult,
        attendanceResult,
        expensesResult,
        expenseCategoriesResult,
        invoicesResult,
        paymentsResult,
        auditResult,
        cashSessionsResult,
      ] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('products').select('*').order('display_order'),
        supabase.from('restaurant_tables').select('*').order('code'),
        supabase.from('table_sessions').select('*').order('opened_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase.from('employees').select('*').order('prenom'),
        supabase.from('attendance_records').select('*').order('created_at', { ascending: false }),
        fetchAllExpenseRows(),
        supabase.from('expense_categories').select('*').order('name'),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('cash_register_sessions').select('*').order('opened_at', { ascending: false }),
      ]);

      const results = [categoriesResult, productsResult, tablesResult, sessionsResult, ordersResult, orderItemsResult, employeesResult, attendanceResult, expensesResult, expenseCategoriesResult, invoicesResult, paymentsResult, auditResult, cashSessionsResult];
      const failedResult = results.find(result => result.error);
      if (failedResult?.error) {
        adminDataLoaded.current = false;
        addNotification(`Chargement administratif incomplet : ${failedResult.error.message}`, 'error');
        return;
      }

      const loadedEmployees = (employeesResult.data || []).map(employeeFromSupabase);
      const employeeById = new Map(loadedEmployees.map(employee => [employee.id, employee]));
      const itemsByOrder = new Map<string, any[]>();
      (orderItemsResult.data || []).forEach((item: any) => {
        const items = itemsByOrder.get(item.order_id) || [];
        items.push(item);
        itemsByOrder.set(item.order_id, items);
      });

      let persistedTables = tablesResult.data || [];
      if (persistedTables.length === 0) {
        const { data: createdTables, error: createTablesError } = await supabase
          .from('restaurant_tables')
          .upsert(initialTables.map(table => ({
            id: table.id,
            code: table.code,
            name: table.name,
            zone: table.zone,
            capacity: table.capacity,
            status: table.status,
            waiter_name: table.waiterName || null,
          })), { onConflict: 'id' })
          .select();
        if (createTablesError) {
          addNotification(`Tables initiales non enregistrées dans Supabase : ${createTablesError.message}`, 'error');
          return;
        }
        persistedTables = createdTables || [];
      }

      if (categoriesResult.data) setCategories(categoriesResult.data.map((row: any) => ({ id: row.id, name: row.name, description: row.description || undefined, iconName: row.icon_name, order: row.display_order, active: row.active })));
      if (productsResult.data) setProducts(productsResult.data.map(productFromSupabase));
      setTables(persistedTables.map(tableFromSupabase));
      if (sessionsResult.data) setTableSessions(sessionsResult.data.map((row: any) => ({ id: row.id, tableId: row.table_id, tableCode: persistedTables.find((table: any) => table.id === row.table_id)?.code || row.table_id, openedAt: row.opened_at, closedAt: row.closed_at || undefined, status: row.status, orderIds: (ordersResult.data || []).filter((order: any) => order.table_session_id === row.id).map((order: any) => order.id), totalAmount: Number(row.total_amount), paidAmount: Number(row.paid_amount), customerCount: row.customer_count })));
      if (ordersResult.data) setOrders(ordersResult.data.map((row: any) => ({ id: row.id, orderNumber: row.order_number, restaurantId: 'resto-umoja', tableId: row.table_id, tableCode: persistedTables.find((table: any) => table.id === row.table_id)?.code || '', sessionId: row.table_session_id || '', items: (itemsByOrder.get(row.id) || []).map(item => ({ id: item.id, productId: item.product_id || '', productName: item.product_name, unitPrice: Number(item.unit_price), quantity: item.quantity, notes: item.notes || undefined, subtotal: Number(item.subtotal) })), totalAmount: Number(row.total_amount), status: row.status, createdAt: row.created_at, preparedAt: row.prepared_at || undefined, servedAt: row.served_at || undefined, specialInstructions: row.special_instructions || undefined, clientName: row.client_name || undefined, orderType: row.order_type })));
      if (employeesResult.data) setEmployees(loadedEmployees);
      if (attendanceResult.data) setAttendanceRecords(attendanceResult.data.map((row: any) => {
        const employee = employeeById.get(row.employee_id);
        return { id: row.id, employeeId: row.employee_id, matricule: employee?.matricule || '', employeeName: employee ? `${employee.prenom} ${employee.nom}` : 'Employé inconnu', employeePhoto: employee?.photo || '', employeePosition: employee?.poste || '', date: row.date, time: row.time, type: row.type, timestamp: new Date(row.created_at).getTime(), scheduledTime: employee?.scheduledShiftStart || '', delayMinutes: row.delay_minutes, status: row.status, isManualCorrection: row.is_manual_correction, correctionReason: row.correction_reason };
      }));
      if (expensesResult.data) setExpenses(expensesResult.data.map(expenseFromSupabase));
      if (expenseCategoriesResult.data) setExpenseCategories(expenseCategoriesResult.data.map((row: any) => ({ id: row.id, name: row.name, iconName: row.icon_name, isDefault: row.is_default })));
      if (invoicesResult.data) setInvoices(invoicesResult.data.map((row: any) => ({ id: row.id, invoiceNumber: row.invoice_number, sessionId: row.table_session_id || '', tableId: row.table_id || '', tableCode: row.table_code || '', orderIds: row.order_ids || [], items: [], subtotal: Number(row.subtotal), discountAmount: Number(row.discount_amount), taxAmount: Number(row.tax_amount), totalAmount: Number(row.total_amount), paidAmount: Number(row.paid_amount), remainingAmount: Math.max(0, Number(row.total_amount) - Number(row.paid_amount)), status: row.status, createdAt: row.created_at, paidAt: row.paid_at || undefined, cashierName: row.cashier_name || '', paymentMethod: row.payment_method, paymentReference: row.payment_reference || undefined })));
      if (paymentsResult.data) setPaymentTransactions(paymentsResult.data.map((row: any) => ({ id: row.id, invoiceId: row.invoice_id, tableId: '', tableCode: '', amount: Number(row.amount), paymentMethod: row.payment_method, reference: row.reference || undefined, note: row.note || undefined, createdAt: row.created_at, cashierName: row.recorded_by || 'Utilisateur autorisé' })));
      if (auditResult.data) setAuditLogs(auditResult.data.map((row: any) => ({ id: row.id, userId: row.user_id || '', userName: row.user_id || 'Système', userRole: '', action: row.action, date: row.created_at.slice(0, 10), time: new Date(row.created_at).toTimeString().slice(0, 8), targetEntity: row.target_entity, targetId: row.target_id, oldValue: row.old_value ? JSON.stringify(row.old_value) : undefined, newValue: row.new_value ? JSON.stringify(row.new_value) : undefined, details: row.details || '' })));
      if (cashSessionsResult.data?.length) {
        const currentSession = cashSessionsResult.data[0];
        const cashPayments = (paymentsResult.data || []).filter((payment: any) => payment.payment_method === 'ESPECES').reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
        const totalExpenses = (expensesResult.data || []).filter((expense: any) => expense.payment_method === 'ESPECES').reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
        const registerFromRow = (row: any): CashRegisterSession => ({ id: row.id, date: row.opened_at.slice(0, 10), openedAt: row.opened_at, openingBalance: Number(row.opening_balance), openedBy: row.opened_by || 'Utilisateur autorisé', status: row.status, closedAt: row.closed_at || undefined, closedBy: row.closed_by || undefined, totalSalesCash: cashPayments, totalSalesMobile: 0, totalSalesCard: 0, totalSalesBank: 0, totalExpenses, theoreticalBalance: Number(row.opening_balance) + cashPayments - totalExpenses, realBalance: row.real_balance === null ? undefined : Number(row.real_balance), variance: row.variance === null ? undefined : Number(row.variance), varianceReason: row.variance_reason || undefined, notes: row.notes || undefined });
        setCashRegister(registerFromRow(currentSession));
        setCashClosuresHistory(cashSessionsResult.data.filter((row: any) => row.status === 'CLOSED').map(registerFromRow));
      }
    };

    void loadAdminData();
  }, [authEmail, currentRole, addNotification]);

  useEffect(() => {
    if (!authEmail || !['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'CAISSIER', 'SERVEUR'].includes(currentRole)) return;
    const loadRecipeData = async () => {
      const [ingredientsResult, recipeIngredientsResult, preparationsResult, movementsResult, salariesResult] = await Promise.all([
        supabase.from('ingredients').select('*').order('name'),
        supabase.from('recipe_ingredients').select('*'),
        supabase.from('kitchen_preparations').select('*').order('prepared_at', { ascending: false }).limit(200),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(300),
        supabase.from('salary_payments').select('*').order('paid_at', { ascending: false }).limit(200),
      ]);
      if (!ingredientsResult.error) {
        setIngredients((ingredientsResult.data || []).map(ingredientFromSupabase));
      }
      if (!recipeIngredientsResult.error) {
        setRecipeIngredients((recipeIngredientsResult.data || []).map((row: any) => ({ id: row.id, productId: row.product_id, ingredientId: row.ingredient_id, quantity: Number(row.quantity) })));
      }
      if (!preparationsResult.error) {
        setKitchenPreparations((preparationsResult.data || []).map((row: any) => ({
          id: row.id,
          productId: row.product_id || '',
          productName: row.product_name,
          quantity: Number(row.quantity),
          notes: row.notes || undefined,
          recordedBy: row.recorded_by || '',
          preparedAt: row.prepared_at,
        })));
      }
      if (!movementsResult.error) {
        setStockMovements((movementsResult.data || []).map((row: any) => ({
          id: row.id,
          ingredientId: row.ingredient_id || '',
          ingredientName: row.ingredient_name,
          movementType: row.movement_type,
          quantity: Number(row.quantity),
          unit: row.unit,
          reason: row.reason || '',
          recordedBy: row.recorded_by || '',
          createdAt: row.created_at,
        })));
      }
      if (!salariesResult.error) {
        setSalaryPayments((salariesResult.data || []).map((row: any) => ({
          id: row.id,
          employeeId: row.employee_id || '',
          employeeName: row.employee_name,
          amount: Number(row.amount),
          periodMonth: row.period_month,
          status: row.status,
          expenseId: row.expense_id || undefined,
          paidAt: row.paid_at,
        })));
      }
    };
    void loadRecipeData();
  }, [authEmail, currentRole, addNotification]);

  useEffect(() => {
    if (!authEmail || currentRole !== 'CUISINE') return;
    const loadKitchenExpenses = async () => {
      const [expensesResult, categoriesResult] = await Promise.all([
        fetchAllExpenseRows('CUISINE'),
        supabase.from('expense_categories').select('*').order('name'),
      ]);
      if (!expensesResult.error && expensesResult.data) setExpenses(expensesResult.data.map(expenseFromSupabase));
      if (!categoriesResult.error && categoriesResult.data) {
        setExpenseCategories(categoriesResult.data.map((row: any) => ({ id: row.id, name: row.name, iconName: row.icon_name, isDefault: row.is_default })));
      }
    };
    void loadKitchenExpenses();
  }, [authEmail, currentRole]);

  // Audit logging helper
  const logAudit = useCallback((
    action: string, 
    targetEntity: string, 
    targetId: string, 
    oldValue?: string, 
    newValue?: string, 
    details?: string
  ) => {
    const now = new Date();
    const log: AuditLog = {
      id: 'log-' + Date.now(),
      userId: currentUser?.id || 'guest',
      userName: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur Client',
      userRole: currentRole,
      action,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      targetEntity,
      targetId,
      oldValue,
      newValue,
      details,
    };
    setAuditLogs(prev => [log, ...prev]);
    if (currentUser?.auth_user_id) {
      void supabase.from('audit_logs').insert({
        user_id: currentUser.auth_user_id,
        action,
        target_entity: targetEntity,
        target_id: targetId,
        old_value: oldValue ? { value: oldValue } : null,
        new_value: newValue ? { value: newValue } : null,
        details: details || null,
      }).then(({ error }) => {
        if (error) console.error('Audit Supabase error:', error.message);
      });
    }
  }, [currentUser, currentRole]);

  // Place Client Order
  const placeClientOrder = useCallback(async (
    tableId: string,
    items: { product: Product; quantity: number; notes?: string }[],
    clientName?: string,
    specialInstructions?: string
  ): Promise<Order> => {
    const table = tables.find(t => t.id === tableId) || tables[0];
    if (!table) throw new Error('Aucune table disponible pour enregistrer la commande.');
    const orderNumber = '#' + (1000 + orders.length + 1);
    
    // Find or create table session
    let session = tableSessions.find(s => s.tableId === table.id && s.status === 'ACTIVE');
    let sessionId = session?.id;
    const sessionWasCreated = !session;

    if (!session) {
      sessionId = 'sess-' + Date.now();
      session = {
        id: sessionId,
        tableId: table.id,
        tableCode: table.code,
        openedAt: new Date().toISOString(),
        status: 'ACTIVE',
        orderIds: [],
        totalAmount: 0,
        paidAmount: 0,
        waiterName: table.waiterName || 'Service Umoja',
        customerCount: table.capacity || 2,
      };
    }

    // Critical rule: Capture unit price AT ORDER TIME (Snapshot)
    const orderItems = items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: item.product.price, // SNAPSHOT PRICE
      quantity: item.quantity,
      notes: item.notes,
      subtotal: item.product.price * item.quantity,
    }));

    const totalAmount = orderItems.reduce((acc, it) => acc + it.subtotal, 0);

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      restaurantId: 'resto-umoja',
      tableId: table.id,
      tableCode: table.code,
      sessionId: sessionId!,
      items: orderItems,
      totalAmount,
      status: 'NOUVELLE',
      createdAt: new Date().toISOString(),
      specialInstructions,
      clientName,
      orderType: 'SUR_PLACE',
    };

    // Persist the complete public client order before updating the visible interface.
    if (sessionWasCreated) {
      const sessionPayload = {
        id: session!.id,
        table_id: table.id,
        opened_by: null,
        opened_at: session!.openedAt,
        status: 'ACTIVE',
        customer_count: session!.customerCount,
        total_amount: totalAmount,
        paid_amount: 0,
      };
      const { error: sessionError } = await supabase.from('table_sessions').insert(sessionPayload);
      if (sessionError) {
        throw new Error(`Session non enregistrée dans Supabase : ${sessionError.message}`);
      }
    }
    const { error: orderError } = await supabase.from('orders').insert({
      id: newOrder.id,
      order_number: orderNumber,
      table_session_id: session!.id,
      table_id: table.id,
      created_by: null,
      client_name: clientName || null,
      status: 'NOUVELLE',
      special_instructions: specialInstructions || null,
      order_type: 'SUR_PLACE',
      total_amount: totalAmount,
      created_at: newOrder.createdAt,
    });
    if (orderError) throw new Error(`Commande non enregistrée dans Supabase : ${orderError.message}`);

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems.map(item => ({
      id: item.id,
      order_id: newOrder.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      notes: item.notes || null,
      subtotal: item.subtotal,
    })));
    if (itemsError) throw new Error(`Articles non enregistrés dans Supabase : ${itemsError.message}`);

    // Update session orders & total
    setTableSessions(prev => sessionWasCreated
      ? [{ ...session!, orderIds: [newOrder.id], totalAmount }, ...prev]
      : prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          orderIds: [...s.orderIds, newOrder.id],
          totalAmount: s.totalAmount + totalAmount,
        };
      }
      return s;
    }));
    setOrders(prev => [newOrder, ...prev]);

    // Update table status to COMMANDE_EN_COURS
    setTables(prev => prev.map(t => {
      if (t.id === table.id) {
        return {
          ...t,
          status: 'COMMANDE_EN_COURS',
          currentSessionId: sessionId,
        };
      }
      return t;
    }));
    void supabase.from('restaurant_tables').update({ status: 'COMMANDE_EN_COURS' }).eq('id', table.id);

    logAudit('CREATION_COMMANDE', 'Order', newOrder.id, undefined, `${orderNumber} - ${totalAmount} CNY`, `Commande passée pour ${table.code}`);
    addNotification(`Nouvelle commande ${orderNumber} (${table.code}) envoyée en cuisine !`, 'success');
    playNotificationSound('order');

    return newOrder;
  }, [tables, orders.length, tableSessions, logAudit, addNotification]);

  // Update order status (Kitchen / Service)
  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    const now = new Date().toISOString();
    void supabase.from('orders').update({
      status: newStatus,
      prepared_at: newStatus === 'PRETE' ? now : undefined,
      served_at: newStatus === 'SERVIE' || newStatus === 'PAYEE' ? now : undefined,
    }).eq('id', orderId).then(({ error }) => {
      if (error) {
        addNotification(`Statut non synchronisé avec Supabase : ${error.message}`, 'error');
        return;
      }
      setOrders(prev => prev.map(ord => {
        if (ord.id === orderId) {
          const oldStatus = ord.status;
          const updated: Order = { ...ord, status: newStatus, preparedAt: newStatus === 'PRETE' ? now : ord.preparedAt, servedAt: newStatus === 'SERVIE' || newStatus === 'PAYEE' ? now : ord.servedAt };
          logAudit('STATUT_COMMANDE', 'Order', orderId, oldStatus, newStatus, `Mise à jour état ${ord.orderNumber} (${ord.tableCode})`);
          if (newStatus === 'PRETE') {
            addNotification(`La commande ${ord.orderNumber} (${ord.tableCode}) est PRÊTE à être servie !`, 'warning');
            playNotificationSound('ready');
          } else if (newStatus === 'ACCEPTEE') {
            addNotification(`Commande ${ord.orderNumber} acceptée en cuisine.`, 'info');
          }
          return updated;
        }
        return ord;
      }));
    });
  }, [logAudit, addNotification]);

  // Cancel order
  const cancelOrder = useCallback((orderId: string, reason?: string) => {
    void supabase.from('orders').update({ status: 'ANNULEE' }).eq('id', orderId).then(({ error }) => {
      if (error) {
        addNotification(`Annulation non enregistrée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setOrders(prev => prev.map(order => {
        if (order.id !== orderId) return order;
        logAudit('ANNULATION_COMMANDE', 'Order', orderId, order.status, 'ANNULEE', reason || 'Annulation manuelle');
        addNotification(`Commande ${order.orderNumber} annulée.`, 'error');
        return { ...order, status: 'ANNULEE' };
      }));
    });
  }, [logAudit, addNotification]);

  // Open Table Session
  const openTableSession = useCallback(async (tableId: string, customerCount: number, waiterName?: string): Promise<TableSession> => {
    const table = tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table introuvable.');
    const sessionId = 'sess-' + Date.now();
    const newSession: TableSession = {
      id: sessionId,
      tableId,
      tableCode: table ? table.code : `Table ${tableId}`,
      openedAt: new Date().toISOString(),
      status: 'ACTIVE',
      orderIds: [],
      totalAmount: 0,
      paidAmount: 0,
      waiterName: waiterName || 'Personnel Umoja',
      customerCount: customerCount || 2,
    };

    const { error: sessionError } = await supabase.from('table_sessions').insert({
      id: newSession.id,
      table_id: tableId,
      opened_by: currentUser?.auth_user_id || null,
      opened_at: newSession.openedAt,
      status: 'ACTIVE',
      customer_count: newSession.customerCount,
      total_amount: 0,
      paid_amount: 0,
    });
    if (sessionError) throw new Error(`Session de table non enregistrée : ${sessionError.message}`);
    const { error: tableError } = await supabase.from('restaurant_tables').update({ status: 'OCCUPEE', waiter_name: waiterName || table.waiterName || null }).eq('id', tableId);
    if (tableError) throw new Error(`Statut de table non enregistré : ${tableError.message}`);

    setTableSessions(prev => [newSession, ...prev]);
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'OCCUPEE',
          currentSessionId: sessionId,
          waiterName: waiterName || t.waiterName,
        };
      }
      return t;
    }));

    logAudit('OUVERTURE_TABLE', 'TableSession', sessionId, 'LIBRE', 'OCCUPEE', `Ouverture session ${table?.code}`);
    addNotification(`Session ouverte pour ${table?.code}`, 'info');
    return newSession;
  }, [tables, currentUser, logAudit, addNotification]);

  // Update table status
  const updateTableStatus = useCallback((tableId: string, status: RestaurantTable['status']) => {
    void supabase.from('restaurant_tables').update({ status }).eq('id', tableId).then(({ error }) => {
      if (error) {
        addNotification(`Statut de table non synchronisé : ${error.message}`, 'error');
        return;
      }
      setTables(prev => prev.map(table => {
        if (table.id !== tableId) return table;
        logAudit('STATUT_TABLE', 'RestaurantTable', tableId, table.status, status, `Changement statut ${table.code}`);
        return { ...table, status };
      }));
    });
  }, [logAudit, addNotification]);

  const generateInvoiceForOrders = useCallback((orderIds: string[], cashierName: string, discountAmount = 0): Invoice | null => {
    const paidOrderIds = new Set(
      invoices.filter(invoice => invoice.status === 'PAYEE').flatMap(invoice => invoice.orderIds)
    );
    const sessionOrders = orders.filter(order =>
      orderIds.includes(order.id) && order.status !== 'ANNULEE' && order.status !== 'PAYEE' && !paidOrderIds.has(order.id)
    );
    if (sessionOrders.length === 0) {
      addNotification('Aucune commande à facturer.', 'warning');
      return null;
    }

    const firstOrder = sessionOrders[0];
    const tableId = firstOrder.tableId;
    const tableCode = firstOrder.tableCode || firstOrder.clientName || 'Comptoir';
    const session = tableSessions.find(s => s.id === firstOrder.sessionId)
      || tableSessions.find(s => s.tableId === tableId && s.status === 'ACTIVE')
      || {
        id: firstOrder.sessionId || '',
        tableId,
        tableCode,
        openedAt: firstOrder.createdAt,
        status: 'ACTIVE' as const,
        orderIds: sessionOrders.map(order => order.id),
        totalAmount: sessionOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        paidAmount: 0,
        customerCount: 1,
      };

    const itemMap = new Map<string, { productName: string; quantity: number; unitPrice: number; subtotal: number }>();
    sessionOrders.forEach(order => {
      order.items.forEach(it => {
        const key = `${it.productName}_${it.unitPrice}`;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.quantity += it.quantity;
          existing.subtotal += it.subtotal;
        } else {
          itemMap.set(key, {
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.subtotal,
          });
        }
      });
    });

    const consolidatedItems = Array.from(itemMap.values());
    const subtotal = consolidatedItems.reduce((acc, i) => acc + i.subtotal, 0) || sessionOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const invoiceNumber = `FACT-2026-${String(invoices.length + 1).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      sessionId: session.id,
      tableId,
      tableCode,
      orderIds: sessionOrders.map(order => order.id),
      items: consolidatedItems,
      subtotal,
      discountAmount,
      taxAmount: 0,
      totalAmount: finalTotal,
      paidAmount: 0,
      remainingAmount: finalTotal,
      status: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
      cashierName,
    };

    setInvoices(prev => [newInvoice, ...prev]);
    void supabase.from('invoices').insert({
      id: newInvoice.id,
      invoice_number: newInvoice.invoiceNumber,
      table_session_id: newInvoice.sessionId || null,
      table_id: newInvoice.tableId || null,
      table_code: newInvoice.tableCode,
      order_ids: newInvoice.orderIds,
      created_by: currentUser?.auth_user_id || null,
      cashier_name: cashierName,
      subtotal: newInvoice.subtotal,
      discount_amount: newInvoice.discountAmount,
      tax_amount: newInvoice.taxAmount,
      total_amount: newInvoice.totalAmount,
      paid_amount: 0,
      status: 'EN_ATTENTE',
      created_at: newInvoice.createdAt,
    }).then(({ error }) => {
      if (error) addNotification(`Facture non enregistrée dans Supabase : ${error.message}`, 'error');
    });

    if (tableId) {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'A_PAYER' } : t));
      void supabase.from('restaurant_tables').update({ status: 'A_PAYER' }).eq('id', tableId);
    }

    logAudit('GENERATION_FACTURE', 'Invoice', newInvoice.id, undefined, `${invoiceNumber} - Total: ${finalTotal} CNY`, `Facture générée pour ${tableCode}`);
    addNotification(`Facture ${invoiceNumber} (${tableCode}) générée avec succès !`, 'success');
    return newInvoice;
  }, [tableSessions, orders, invoices, currentUser, logAudit, addNotification]);

  const generateInvoiceForTable = useCallback((tableId: string, cashierName: string, discountAmount = 0): Invoice | null => {
    const paidOrderIds = new Set(
      invoices.filter(invoice => invoice.status === 'PAYEE').flatMap(invoice => invoice.orderIds)
    );
    const pendingOnTable = orders.filter(order =>
      order.tableId === tableId
      && order.status !== 'ANNULEE'
      && order.status !== 'PAYEE'
      && !paidOrderIds.has(order.id)
    );
    if (pendingOnTable.length === 0) {
      addNotification('Aucune commande enregistrée pour cette table.', 'warning');
      return null;
    }
    return generateInvoiceForOrders(pendingOnTable.map(order => order.id), cashierName, discountAmount);
  }, [orders, invoices, generateInvoiceForOrders, addNotification]);

  // Record Payment
  const recordPayment = useCallback(async (
    invoiceId: string,
    amountPaid: number,
    method: PaymentMethod,
    reference?: string,
    note?: string
  ) => {
    let invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      return { success: false, isFullyPaid: false, remaining: 0 };
    }

    const newPaidAmount = invoice.paidAmount + amountPaid;
    const remaining = Math.max(0, invoice.totalAmount - newPaidAmount);
    const isFullyPaid = remaining <= 0;

    // Create payment transaction record
    const transaction: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      invoiceId,
      tableId: invoice.tableId,
      tableCode: invoice.tableCode,
      amount: amountPaid,
      paymentMethod: method,
      reference,
      note,
      createdAt: new Date().toISOString(),
      cashierName: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Caissière',
    };

    const { error: paymentError } = await supabase.from('payments').insert({
      id: transaction.id,
      invoice_id: invoiceId,
      amount: amountPaid,
      payment_method: method,
      reference: reference || null,
      note: note || null,
      recorded_by: currentUser?.auth_user_id || null,
      created_at: transaction.createdAt,
    });
    if (paymentError) {
      addNotification(`Paiement non enregistré dans Supabase : ${paymentError.message}`, 'error');
      return { success: false, isFullyPaid: false, remaining: invoice.remainingAmount };
    }
    const { error: invoiceError } = await supabase.from('invoices').update({
      paid_amount: newPaidAmount,
      status: isFullyPaid ? 'PAYEE' : 'EN_ATTENTE',
      paid_at: isFullyPaid ? new Date().toISOString() : null,
      payment_method: method,
      payment_reference: reference || null,
    }).eq('id', invoiceId);
    if (invoiceError) {
      addNotification(`Facture non mise à jour dans Supabase : ${invoiceError.message}`, 'error');
      return { success: false, isFullyPaid: false, remaining: invoice.remainingAmount };
    }

    setPaymentTransactions(prev => [transaction, ...prev]);

    // Update invoice
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          paidAmount: newPaidAmount,
          remainingAmount: remaining,
          status: isFullyPaid ? 'PAYEE' : 'EN_ATTENTE',
          paidAt: isFullyPaid ? new Date().toISOString() : inv.paidAt,
          paymentMethod: method,
          paymentReference: reference,
        };
      }
      return inv;
    }));

    // Update Cash Register totals
    setCashRegister(prev => {
      const isCash = method === 'ESPECES';
      const isMobile = ['WECHAT', 'ALIPAY', 'QR_CODE'].includes(method);
      const isCard = method === 'CARTE';
      const isBank = method === 'BANQUE';

      const updatedCashSales = isCash ? prev.totalSalesCash + amountPaid : prev.totalSalesCash;
      const updatedMobileSales = isMobile ? prev.totalSalesMobile + amountPaid : prev.totalSalesMobile;
      const updatedCardSales = isCard ? prev.totalSalesCard + amountPaid : prev.totalSalesCard;
      const updatedBankSales = isBank ? prev.totalSalesBank + amountPaid : prev.totalSalesBank;

      const theoretical = prev.openingBalance + updatedCashSales - prev.totalExpenses;

      return {
        ...prev,
        totalSalesCash: updatedCashSales,
        totalSalesMobile: updatedMobileSales,
        totalSalesCard: updatedCardSales,
        totalSalesBank: updatedBankSales,
        theoreticalBalance: theoretical,
      };
    });

    // If fully paid, close table session & free table (set to LIBRE)
    if (isFullyPaid) {
      setTableSessions(prev => prev.map(sess => {
        if (sess.id === invoice!.sessionId) {
          return {
            ...sess,
            status: 'CLOSED',
            closedAt: new Date().toISOString(),
            paidAmount: sess.totalAmount,
          };
        }
        return sess;
      }));

      // Release Table -> LIBRE
      setTables(prev => prev.map(t => {
        if (t.id === invoice!.tableId) {
          return {
            ...t,
            status: 'LIBRE',
            currentSessionId: undefined,
          };
        }
        return t;
      }));
      void supabase.from('table_sessions').update({ status: 'CLOSED', closed_at: new Date().toISOString(), paid_amount: invoice.totalAmount }).eq('id', invoice.sessionId);
      void supabase.from('restaurant_tables').update({ status: 'LIBRE' }).eq('id', invoice.tableId);
      const billedOrderIds = invoice.orderIds.filter(Boolean);
      if (billedOrderIds.length > 0) {
        const servedAt = new Date().toISOString();
        void supabase.from('orders').update({ status: 'PAYEE', served_at: servedAt }).in('id', billedOrderIds).then(({ error }) => {
          if (error) {
            addNotification(`Commandes non marquées payées : ${error.message}`, 'warning');
            return;
          }
          setOrders(prev => prev.map(order => billedOrderIds.includes(order.id) ? { ...order, status: 'PAYEE', servedAt } : order));
        });
      }

      logAudit('PAIEMENT_TOTAL_FACTURE', 'Invoice', invoiceId, 'EN_ATTENTE', 'PAYEE', `Paiement total reçu de ${amountPaid} FC via ${method}. Table ${invoice.tableCode} libérée.`);
      addNotification(`Paiement de ${amountPaid} FC reçu. Facture ${invoice.invoiceNumber} SOLDÉE. Table libérée !`, 'success');
      playNotificationSound('success');
    } else {
      logAudit('PAIEMENT_PARTIEL_FACTURE', 'Invoice', invoiceId, undefined, `Acompte: ${amountPaid} FC, Reste: ${remaining} FC`, `Paiement partiel pour ${invoice.tableCode}`);
      addNotification(`Acompte de ${amountPaid} FC enregistré. Reste à payer: ${remaining} FC`, 'info');
    }

    return { success: true, isFullyPaid, remaining };
  }, [invoices, currentUser, logAudit, addNotification]);

  const cancelPaidSale = useCallback(async (invoiceId: string): Promise<boolean> => {
    if (currentRole !== 'ADMINISTRATEUR' && currentRole !== 'RESPONSABLE') {
      addNotification('L’annulation d’une vente est réservée à l’administrateur.', 'error');
      return false;
    }
    const invoice = invoices.find(item => item.id === invoiceId);
    if (!invoice) {
      addNotification('Transaction introuvable.', 'error');
      return false;
    }
    if (invoice.status === 'ANNULEE') return false;

    const { error: invoiceError } = await supabase.from('invoices').update({ status: 'ANNULEE' }).eq('id', invoiceId);
    if (invoiceError) {
      addNotification(`Annulation non enregistrée : ${invoiceError.message}`, 'error');
      return false;
    }

    const billedOrderIds = (invoice.orderIds || []).filter(Boolean);
    if (billedOrderIds.length > 0) {
      const { error: ordersError } = await supabase.from('orders').update({ status: 'ANNULEE' }).in('id', billedOrderIds);
      if (ordersError) {
        addNotification(`Commandes liées non annulées : ${ordersError.message}`, 'warning');
      } else {
        setOrders(prev => prev.map(order => billedOrderIds.includes(order.id) ? { ...order, status: 'ANNULEE' } : order));
      }
    }

    setInvoices(prev => prev.map(item => (
      item.id === invoiceId ? { ...item, status: 'ANNULEE' as const } : item
    )));
    logAudit(
      'ANNULATION_VENTE',
      'Invoice',
      invoiceId,
      'PAYEE',
      'ANNULEE',
      `Annulation de ${invoice.invoiceNumber} (${invoice.paidAmount} FC). CA et bénéfice recalculés.`
    );
    addNotification(`Vente ${invoice.invoiceNumber} annulée. Le chiffre d’affaires a été mis à jour.`, 'warning');
    return true;
  }, [currentRole, invoices, logAudit, addNotification]);

  // Product Management
  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: 'prod-' + Date.now(),
    };
    const { error } = await supabase.from('products').insert(productToSupabase(newProduct));
    if (error) {
      addNotification(`Produit non enregistré dans Supabase : ${error.message}`, 'error');
      return;
    }
    setProducts(prev => [...prev, newProduct]);
    logAudit('CREATION_PRODUIT', 'Product', newProduct.id, undefined, newProduct.name, `Création plat ${newProduct.name} (${newProduct.price} FC)`);
    addNotification(`Produit "${newProduct.name}" ajouté avec succès.`, 'success');
  }, [logAudit, addNotification]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>): Promise<boolean> => {
    const existing = products.find(product => product.id === id);
    if (!existing) return false;
    const updated = { ...existing, ...updates };
    const { error } = await supabase.from('products').update(productToSupabase(updated)).eq('id', id);
    if (error) {
      addNotification(`Produit non modifié dans Supabase : ${error.message}`, 'error');
      return false;
    }
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        logAudit('MODIFICATION_PRODUIT', 'Product', id, JSON.stringify(p), JSON.stringify(updated), `Mise à jour produit ${p.name}`);
        return updated;
      }
      return p;
    }));
    addNotification('Produit modifié avec succès.', 'info');
    return true;
  }, [products, logAudit, addNotification]);

  const deleteProduct = useCallback(async (id: string) => {
    const prod = products.find(p => p.id === id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      addNotification(`Produit non supprimé de Supabase : ${error.message}`, 'error');
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    logAudit('SUPPRESSION_PRODUIT', 'Product', id, prod?.name, undefined, `Suppression plat ${prod?.name}`);
    addNotification('Produit supprimé du menu.', 'warning');
  }, [products, logAudit, addNotification]);

  const toggleProductAvailability = useCallback(async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const nextAvailable = !product.available;
    const { error } = await supabase.from('products').update({ available: nextAvailable }).eq('id', id);
    if (error) {
      addNotification(`Disponibilité non enregistrée dans Supabase : ${error.message}`, 'error');
      return;
    }
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        logAudit('DISPONIBILITE_PRODUIT', 'Product', id, String(p.available), String(nextAvailable), `Carte client : ${p.name} ${nextAvailable ? 'visible' : 'masqué'}`);
        addNotification(
          nextAvailable ? `${p.name} est de nouveau visible dans l’Espace Client.` : `${p.name} est masqué de la carte client.`,
          nextAvailable ? 'info' : 'warning'
        );
        return { ...p, available: nextAvailable };
      }
      return p;
    }));
  }, [products, logAudit, addNotification]);

  const addIngredient = useCallback(async (name: string, unit: string, unitCost: number, extras?: { category?: string; stockQty?: number; minStock?: number }): Promise<boolean> => {
    const ingredient: Ingredient = {
      id: `ing-${Date.now()}`,
      name: name.trim(),
      unit: unit.trim() || 'unité',
      unitCost,
      category: extras?.category || 'Divers',
      stockQty: extras?.stockQty || 0,
      minStock: extras?.minStock || 0,
    };
    const payload: Record<string, unknown> = {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      unit_cost: ingredient.unitCost,
      category: ingredient.category,
      stock_qty: ingredient.stockQty,
      min_stock: ingredient.minStock,
    };
    let { error } = await supabase.from('ingredients').insert(payload);
    if (error && /stock_qty|min_stock|category/i.test(error.message)) {
      ({ error } = await supabase.from('ingredients').insert({ id: ingredient.id, name: ingredient.name, unit: ingredient.unit, unit_cost: ingredient.unitCost }));
    }
    if (error) {
      addNotification(`Ingrédient non enregistré : ${error.message}`, 'error');
      return false;
    }
    setIngredients(previous => [...previous, ingredient].sort((left, right) => left.name.localeCompare(right.name)));
    logAudit('CREATION_INGREDIENT', 'Ingredient', ingredient.id, undefined, ingredient.name, `Coût unitaire : ${ingredient.unitCost}`);
    return true;
  }, [logAudit, addNotification]);

  const applyStockMovement = useCallback(async (input: { ingredientId?: string; name: string; category?: string; unit: string; quantity: number; type: 'ENTREE' | 'SORTIE'; reason: string; unitCost?: number; notify?: boolean }): Promise<{ ok: boolean; remaining: number; name: string }> => {
    if (input.quantity <= 0) return { ok: false, remaining: 0, name: input.name };
    const { data: authData } = await supabase.auth.getUser();
    let ingredient = input.ingredientId
      ? ingredients.find(item => item.id === input.ingredientId)
      : findIngredientByName(input.name, ingredients);
    if (!ingredient) {
      const created = await addIngredient(input.name, input.unit, input.unitCost || 0, { category: input.category, stockQty: 0, minStock: 0 });
      if (!created) return { ok: false, remaining: 0, name: input.name };
      const { data: latest } = await supabase.from('ingredients').select('*').eq('name', input.name.trim()).maybeSingle();
      if (!latest) return { ok: false, remaining: 0, name: input.name };
      ingredient = ingredientFromSupabase(latest);
    }
    const current = Number(ingredient.stockQty || 0);
    const remaining = input.type === 'ENTREE' ? current + input.quantity : current - input.quantity;
    if (input.type === 'SORTIE' && remaining < -0.0001) {
      addNotification(`Stock insuffisant pour ${ingredient.name} (${current} ${ingredient.unit} disponibles).`, 'error');
      return { ok: false, remaining: current, name: ingredient.name };
    }
    const nextQty = Math.max(0, remaining);
    const updatePayload: Record<string, unknown> = {
      stock_qty: nextQty,
      unit: input.unit || ingredient.unit,
      category: input.category || ingredient.category,
    };
    if (input.unitCost && input.unitCost > 0) updatePayload.unit_cost = input.unitCost;
    let { error } = await supabase.from('ingredients').update(updatePayload).eq('id', ingredient.id);
    if (error && /stock_qty|min_stock|category/i.test(error.message)) {
      addNotification('Colonnes de stock absentes. Exécutez supabase/stock-management.sql dans Supabase.', 'error');
      return { ok: false, remaining: current, name: ingredient.name };
    }
    if (error) {
      addNotification(`Stock non mis à jour : ${error.message}`, 'error');
      return { ok: false, remaining: current, name: ingredient.name };
    }
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      movementType: input.type,
      quantity: input.quantity,
      unit: input.unit || ingredient.unit,
      reason: input.reason,
      recordedBy: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur',
      createdAt: new Date().toISOString(),
    };
    await supabase.from('stock_movements').insert({
      id: movement.id,
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      movement_type: input.type,
      quantity: input.quantity,
      unit: movement.unit,
      reason: input.reason,
      recorded_by: authData.user?.id || currentUser?.auth_user_id || null,
      created_at: movement.createdAt,
    });
    setIngredients(previous => previous.map(item => item.id === ingredient!.id ? { ...item, stockQty: nextQty, unit: input.unit || item.unit, category: input.category || item.category, unitCost: input.unitCost || item.unitCost } : item));
    setStockMovements(previous => [movement, ...previous]);
    if (input.notify !== false) {
      if (nextQty <= 0) addNotification(`Rupture de stock — réapprovisionnement nécessaire (${ingredient.name}).`, 'warning');
      else if (ingredient.minStock > 0 && nextQty <= ingredient.minStock) addNotification(`Stock faible — veuillez réapprovisionner ${ingredient.name} (${nextQty} ${ingredient.unit}).`, 'warning');
      else if (input.type === 'ENTREE') addNotification(`${ingredient.name} : ${nextQty} ${ingredient.unit} en stock.`, 'success');
      else addNotification(`${ingredient.name} : ${nextQty} ${ingredient.unit} restants.`, 'info');
    }
    return { ok: true, remaining: nextQty, name: ingredient.name };
  }, [ingredients, addIngredient, currentUser, addNotification]);

  const stockBackfillDone = useRef(false);
  useEffect(() => {
    if (!['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'CAISSIER'].includes(currentRole)) return;
    if (stockBackfillDone.current) return;
    const purchases = expenses.filter(expense => isPurchaseCategory(expense.category) && Number(expense.quantity) > 0);
    if (purchases.length === 0) return;
    const already = new Set(
      stockMovements
        .map(movement => movement.reason)
        .filter(reason => reason.includes('expense:'))
        .map(reason => reason.slice(reason.indexOf('expense:') + 8).trim())
    );
    const pending = purchases.filter(expense => !already.has(expense.id));
    if (pending.length === 0) {
      stockBackfillDone.current = true;
      return;
    }
    stockBackfillDone.current = true;
    void (async () => {
      let applied = 0;
      for (const expense of pending) {
        const result = await applyStockMovement({
          name: (expense.itemName || expense.description).trim(),
          category: expense.category,
          unit: expense.unit || 'kg',
          quantity: Number(expense.quantity),
          type: 'ENTREE',
          reason: `Achat dépense expense:${expense.id}`,
          unitCost: Number(expense.quantity) ? expense.amount / Number(expense.quantity) : 0,
          notify: false,
        });
        if (result.ok) applied += 1;
      }
      if (applied > 0) {
        addNotification(`${applied} achat(s) des dépenses ont alimenté le stock.`, 'success');
      }
    })();
  }, [currentRole, expenses, ingredients, stockMovements, applyStockMovement, addNotification]);

  const updateStockItem = useCallback(async (id: string, updates: { minStock?: number; category?: string }): Promise<boolean> => {
    const payload: Record<string, unknown> = {};
    if (updates.minStock !== undefined) payload.min_stock = updates.minStock;
    if (updates.category) payload.category = updates.category;
    const { error } = await supabase.from('ingredients').update(payload).eq('id', id);
    if (error) {
      addNotification(`Article de stock non modifié : ${error.message}`, 'error');
      return false;
    }
    setIngredients(previous => previous.map(item => item.id === id ? { ...item, minStock: updates.minStock ?? item.minStock, category: updates.category || item.category } : item));
    return true;
  }, [addNotification]);

  const setRecipeIngredient = useCallback(async (productId: string, ingredientId: string, quantity: number): Promise<boolean> => {
    const existing = recipeIngredients.find(item => item.productId === productId && item.ingredientId === ingredientId);
    const recipeIngredient: RecipeIngredient = { id: existing?.id || `recipe-ing-${Date.now()}`, productId, ingredientId, quantity };
    const { error } = await supabase.from('recipe_ingredients').upsert({ id: recipeIngredient.id, product_id: productId, ingredient_id: ingredientId, quantity }, { onConflict: 'product_id,ingredient_id' });
    if (error) {
      addNotification(`Recette non enregistrée : ${error.message}`, 'error');
      return false;
    }
    setRecipeIngredients(previous => existing ? previous.map(item => item.id === existing.id ? recipeIngredient : item) : [...previous, recipeIngredient]);
    return true;
  }, [recipeIngredients, addNotification]);

  const removeRecipeIngredient = useCallback(async (recipeIngredientId: string): Promise<boolean> => {
    const { error } = await supabase.from('recipe_ingredients').delete().eq('id', recipeIngredientId);
    if (error) {
      addNotification(`Élément de recette non supprimé : ${error.message}`, 'error');
      return false;
    }
    setRecipeIngredients(previous => previous.filter(item => item.id !== recipeIngredientId));
    return true;
  }, [addNotification]);

  const recordKitchenPreparation = useCallback(async (productId: string, quantity: number, notes?: string): Promise<boolean> => {
    const product = products.find(item => item.id === productId);
    if (!product || quantity <= 0) return false;
    const preparation: KitchenPreparation = {
      id: `prep-${Date.now()}`,
      productId,
      productName: product.name,
      quantity,
      notes: notes?.trim() || undefined,
      recordedBy: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Cuisine',
      preparedAt: new Date().toISOString(),
    };
    const { data: authData } = await supabase.auth.getUser();
    const recordedById = authData.user?.id || currentUser?.auth_user_id || null;
    const { error } = await supabase.from('kitchen_preparations').insert({
      id: preparation.id,
      product_id: product.id,
      product_name: product.name,
      quantity,
      notes: preparation.notes || null,
      recorded_by: recordedById,
      prepared_at: preparation.preparedAt,
    });
    if (error) {
      addNotification(`Préparation non enregistrée dans Supabase : ${error.message}. Exécutez supabase/profitability-trace.sql si la table manque.`, 'error');
      return false;
    }
    setKitchenPreparations(previous => [preparation, ...previous]);
    const recipeLines = recipeIngredients.filter(item => item.productId === product.id);
    for (const line of recipeLines) {
      const ingredient = ingredients.find(item => item.id === line.ingredientId);
      if (!ingredient) continue;
      await applyStockMovement({
        ingredientId: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: line.quantity * quantity,
        type: 'SORTIE',
        reason: `Préparation ${product.name} × ${quantity}`,
      });
    }
    logAudit('PREPARATION_CUISINE', 'KitchenPreparation', preparation.id, undefined, `${quantity} x ${product.name}`, preparation.notes);
    addNotification(`${quantity} x ${product.name} enregistré(s) comme préparé(s).`, 'success');
    return true;
  }, [products, currentUser, logAudit, addNotification, recipeIngredients, ingredients, applyStockMovement]);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now(),
    };
    void supabase.from('categories').insert({ id: newCat.id, name: newCat.name, description: newCat.description || null, icon_name: newCat.iconName, display_order: newCat.order, active: newCat.active }).then(({ error }) => {
      if (error) {
        addNotification(`Catégorie non enregistrée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setCategories(prev => [...prev, newCat]);
      logAudit('CREATION_CATEGORIE', 'Category', newCat.id, undefined, newCat.name, `Nouvelle catégorie ${newCat.name}`);
      addNotification(`Catégorie "${newCat.name}" ajoutée.`, 'success');
    });
  }, [logAudit, addNotification]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    void supabase.from('categories').delete().eq('id', id).then(({ error }) => {
      if (error) {
        addNotification(`Catégorie non supprimée de Supabase : ${error.message}`, 'error');
        return;
      }
      setCategories(prev => prev.filter(c => c.id !== id));
    });
  }, [addNotification]);

  // Tables Management
  const addTable = useCallback((table: Omit<RestaurantTable, 'id'>) => {
    const newTable: RestaurantTable = {
      ...table,
      id: 'tbl-' + Date.now(),
      status: 'LIBRE',
    };
    void supabase.from('restaurant_tables').insert({ id: newTable.id, code: newTable.code, name: newTable.name || newTable.code, zone: newTable.zone, capacity: newTable.capacity, status: newTable.status, waiter_name: newTable.waiterName || null }).then(({ error }) => {
      if (error) {
        addNotification(`Table non enregistrée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setTables(prev => [...prev, newTable]);
      logAudit('CREATION_TABLE', 'RestaurantTable', newTable.id, undefined, newTable.code, `Ajout de la table ${newTable.code}`);
      addNotification(`Table "${newTable.code}" créée.`, 'success');
    });
  }, [logAudit, addNotification]);

  const updateTable = useCallback((id: string, updates: Partial<RestaurantTable>) => {
    const existing = tables.find(table => table.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    void supabase.from('restaurant_tables').update({ code: updated.code, name: updated.name, zone: updated.zone, capacity: updated.capacity, status: updated.status, waiter_name: updated.waiterName || null }).eq('id', id).then(({ error }) => {
      if (error) {
        addNotification(`Table non modifiée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setTables(prev => prev.map(table => table.id === id ? updated : table));
      logAudit('MODIFICATION_TABLE', 'RestaurantTable', id, JSON.stringify(existing), JSON.stringify(updated), `Mise à jour de ${updated.code}`);
      addNotification('Table mise à jour.', 'info');
    });
  }, [tables, logAudit, addNotification]);

  const deleteTable = useCallback((id: string) => {
    void supabase.from('restaurant_tables').delete().eq('id', id).then(({ error }) => {
      if (error) {
        addNotification(`Table non supprimée de Supabase : ${error.message}`, 'error');
        return;
      }
      setTables(prev => prev.filter(table => table.id !== id));
      addNotification('Table supprimée.', 'warning');
    });
  }, [addNotification]);

  // Employee Management
  const addEmployee = useCallback((emp: Omit<Employee, 'id' | 'matricule'>) => {
    const matricule = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      ...emp,
      id: 'emp-' + Date.now(),
      matricule,
    };
    setEmployees(prev => [...prev, newEmp]);
    logAudit('CREATION_EMPLOYE', 'Employee', newEmp.id, undefined, `${newEmp.matricule} - ${newEmp.prenom} ${newEmp.nom}`, `Nouvel employé enregistré`);
    addNotification(`Employé ${newEmp.prenom} ${newEmp.nom} (${matricule}) créé.`, 'success');
  }, [employees.length, logAudit, addNotification]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>): Promise<boolean> => {
    const existing = employees.find(employee => employee.id === id);
    if (!existing) return false;
    const updated = { ...existing, ...updates };
    if (updates.role && updates.role !== existing.role) {
      if (!existing.auth_user_id) {
        addNotification('Rôle non modifié : cette fiche employé n’est liée à aucun compte de connexion Supabase.', 'error');
        return false;
      }
      const { data, error } = await supabase.functions.invoke('update-staff-role', { body: { employeeId: id, role: updates.role } });
      if (error || !data?.success) {
        addNotification(`Rôle non modifié dans Supabase : ${data?.error || error?.message || 'Erreur inconnue.'}`, 'error');
        return false;
      }
    }
    const { error } = await supabase.from('employees').update(employeeToSupabase(updated)).eq('id', id);
    if (error) {
      addNotification(`Employé non modifié dans Supabase : ${error.message}`, 'error');
      return false;
    }
    setEmployees(prev => prev.map(employee => employee.id === id ? updated : employee));
    logAudit('MODIFICATION_EMPLOYE', 'Employee', id, JSON.stringify(existing), JSON.stringify(updated), `Modification fiche de ${updated.prenom} ${updated.nom}`);
    addNotification('Fiche employé mise à jour.', 'info');
    return true;
  }, [employees, logAudit, addNotification]);

  const deleteEmployee = useCallback(async (id: string) => {
    const { data, error } = await supabase.functions.invoke('delete-staff-user', { body: { employeeId: id } });
    if (error || !data?.success) {
      addNotification(`Employé non supprimé : ${data?.error || error?.message || 'Erreur inconnue.'}`, 'error');
      return;
    }
    setEmployees(prev => prev.filter(employee => employee.id !== id));
    setAttendanceRecords(prev => prev.filter(record => record.employeeId !== id));
    logAudit('SUPPRESSION_EMPLOYE', 'Employee', id, undefined, undefined, 'Employé et données associées supprimés');
    addNotification('Employé supprimé avec succès de Supabase.', 'warning');
  }, [addNotification]);

  // Attendance is tied to the authenticated employee; no employee identifier is accepted from the UI.
  const clockCurrentUserAttendance = useCallback(async (
    pin: string,
    type: AttendanceType
  ): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
    const emp = currentUser;
    if (!emp?.auth_user_id) return { success: false, message: 'Votre profil employé sécurisé est indisponible. Contactez l’administration.' };
    if (emp.pin !== pin) return { success: false, message: 'Code PIN incorrect.' };
    if (emp.statut !== 'ACTIF') return { success: false, message: `Votre compte est actuellement ${emp.statut}. Pointage refusé.` };

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const [currentHour, currentMin] = [now.getHours(), now.getMinutes()];
    const currentTotalMinutes = currentHour * 60 + currentMin;

    const { data: workRules } = await supabase
      .from('work_rules')
      .select('work_start, late_after_minutes')
      .eq('id', true)
      .maybeSingle();
    const scheduledStart = String(emp.scheduledShiftStart || workRules?.work_start || '08:00').slice(0, 5);
    const [schedHour, schedMin] = scheduledStart.split(':').map(Number);
    const scheduledTotalMinutes = (schedHour || 0) * 60 + (schedMin || 0);
    const lateAfterMinutes = Number(workRules?.late_after_minutes ?? 5);

    let delayMinutes = 0;
    let status: AttendanceStatus = 'PRESENT';

    if (type === 'ENTREE') {
      if (currentTotalMinutes > scheduledTotalMinutes + lateAfterMinutes) {
        delayMinutes = currentTotalMinutes - scheduledTotalMinutes;
        status = 'RETARD';
      }
    }

    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employeeId: emp.id,
      matricule: emp.matricule,
      employeeName: `${emp.prenom} ${emp.nom}`,
      employeePhoto: emp.photo,
      employeePosition: emp.poste,
      date: dateStr,
      time: timeStr,
      type,
      timestamp: Date.now(),
      scheduledTime: scheduledStart,
      delayMinutes,
      status,
    };

    const { error } = await supabase.from('attendance_records').insert({
      id: record.id,
      employee_id: record.employeeId,
      recorded_by: currentUser?.auth_user_id || null,
      date: record.date,
      time: record.time,
      type: record.type,
      status: record.status,
      delay_minutes: record.delayMinutes,
      validation_method: 'PIN',
    });
    if (error) {
      const missingTable = /does not exist|schema cache|could not find the table/i.test(error.message);
      if (!missingTable) return { success: false, message: `Pointage non enregistré dans Supabase : ${error.message}` };
      try {
        const raw = localStorage.getItem('umoja_attendance_fallback_v1');
        const stored = raw ? JSON.parse(raw) as AttendanceRecord[] : [];
        localStorage.setItem('umoja_attendance_fallback_v1', JSON.stringify([record, ...stored].slice(0, 200)));
      } catch {
        /* ignore storage */
      }
      addNotification('Table distante indisponible : pointage conservé localement.', 'warning');
    }

    setAttendanceRecords(prev => [record, ...prev]);

    const typeLabels: Record<AttendanceType, string> = {
      ENTREE: 'Arrivée / Prise de poste',
      DEBUT_PAUSE: 'Début de pause',
      FIN_PAUSE: 'Fin de pause',
      SORTIE: 'Départ / Fin de service',
    };

    logAudit('POINTAGE_PRESENCE', 'AttendanceRecord', record.id, undefined, `${emp.matricule} - ${type}`, `Pointage ${typeLabels[type]} à ${timeStr}`);
    
    let msg = `Pointage validé : ${typeLabels[type]} à ${timeStr}.`;
    if (status === 'RETARD') {
      msg += ` Retard constaté : ${delayMinutes} minutes.`;
    }

    addNotification(msg, status === 'RETARD' ? 'warning' : 'success');
    playNotificationSound('success');

    return { success: true, message: msg, record };
  }, [currentUser, logAudit, addNotification]);

  // Correct Attendance (Admin only with justification)
  const correctAttendance = useCallback((recordId: string, newStatus: AttendanceStatus, reason: string, adminName: string) => {
    const existing = attendanceRecords.find(record => record.id === recordId);
    if (!existing) return;
    void supabase.from('attendance_records').update({ status: newStatus, is_manual_correction: true, correction_reason: reason, recorded_by: currentUser?.auth_user_id || null }).eq('id', recordId).then(({ error }) => {
      if (error) {
        addNotification(`Correction non enregistrée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setAttendanceRecords(prev => prev.map(record => record.id === recordId ? { ...record, status: newStatus, isManualCorrection: true, correctedBy: adminName, correctionReason: reason } : record));
      logAudit('CORRECTION_POINTAGE', 'AttendanceRecord', recordId, existing.status, newStatus, `Correction manuelle par ${adminName}. Motif: ${reason}`);
      addNotification('Correction de présence enregistrée dans le journal d’audit.', 'info');
    });
  }, [attendanceRecords, currentUser, logAudit, addNotification]);

  // Expense Management
  const recordExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt'> & { createdAt?: string }): Promise<boolean> => {
    const newExpense: Expense = {
      ...data,
      id: 'exp-' + Date.now(),
      createdAt: data.createdAt || new Date().toISOString(),
    };

    const { data: authData } = await supabase.auth.getUser();
    const payload: Record<string, unknown> = {
      id: newExpense.id,
      service: newExpense.service,
      category: newExpense.category,
      item_name: newExpense.itemName || null,
      quantity: expenseQuantityOrNull(newExpense.quantity),
      unit: newExpense.unit || null,
      description: newExpense.description,
      amount: newExpense.amount,
      payment_method: newExpense.paymentMethod,
      supplier: newExpense.supplier || null,
      reference: newExpense.reference || newExpense.unit || null,
      recorded_by: authData.user?.id || currentUser?.auth_user_id || null,
      created_at: newExpense.createdAt,
      expense_date: newExpense.date,
    };
    let { error } = await supabase.from('expenses').insert(payload);
    if (error && /unit/i.test(error.message)) {
      delete payload.unit;
      ({ error } = await supabase.from('expenses').insert(payload));
    }
    if (error && /created_at/i.test(error.message)) {
      delete payload.created_at;
      ({ error } = await supabase.from('expenses').insert(payload));
    }
    if (error) {
      addNotification(`Dépense non enregistrée dans Supabase : ${error.message}`, 'error');
      return false;
    }
    setExpenses(prev => [newExpense, ...prev]);

    if (isPurchaseCategory(newExpense.category) && newExpense.quantity && newExpense.quantity > 0) {
      const designation = (newExpense.itemName || newExpense.description).trim();
      const unitCost = newExpense.amount / newExpense.quantity;
      await applyStockMovement({
        name: designation,
        category: newExpense.category,
        unit: newExpense.unit || 'kg',
        quantity: newExpense.quantity,
        type: 'ENTREE',
        reason: `Achat dépense expense:${newExpense.id}`,
        unitCost,
      });
    }

    if (data.paymentMethod === 'ESPECES') {
      setCashRegister(prev => {
        const updatedExpenses = prev.totalExpenses + data.amount;
        return { ...prev, totalExpenses: updatedExpenses, theoreticalBalance: prev.openingBalance + prev.totalSalesCash - updatedExpenses };
      });
    }

    logAudit('NOUVELLE_DEPENSE', 'Expense', newExpense.id, undefined, `${newExpense.amount} FC - ${newExpense.category}`, newExpense.description);
    addNotification(`Dépense de ${newExpense.amount} FC enregistrée (${newExpense.category}).`, 'info');
    return true;
  }, [currentUser, currentRole, logAudit, addNotification, applyStockMovement]);

  const payEmployeeSalary = useCallback(async (employeeId: string, periodMonth: string, confirmDuplicate = false, occurredAt?: string): Promise<boolean> => {
    const employee = employees.find(item => item.id === employeeId);
    if (!employee) return false;
    const amount = Number(employee.salaireBase || employee.salaire || 0);
    if (amount <= 0) {
      addNotification('Salaire non défini pour cet employé.', 'error');
      return false;
    }
    const alreadyPaid = salaryPayments.find(item => item.employeeId === employeeId && item.periodMonth === periodMonth && item.status === 'PAYE');
    if (alreadyPaid && !confirmDuplicate) {
      addNotification(`Salaire déjà payé pour ${periodMonth}. Confirmez pour payer à nouveau.`, 'warning');
      return false;
    }
    const name = `${employee.prenom} ${employee.nom}`;
    const paidAtDate = occurredAt ? new Date(occurredAt) : new Date();
    const paidAtIso = Number.isNaN(paidAtDate.getTime()) ? new Date().toISOString() : paidAtDate.toISOString();
    const expenseDay = occurredAt && occurredAt.length >= 10 ? occurredAt.slice(0, 10) : paidAtIso.slice(0, 10);
    const recorded = await recordExpense({
      date: expenseDay,
      createdAt: paidAtIso,
      service: 'ADMINISTRATION',
      category: 'Charges salariales',
      itemName: name,
      amount,
      description: `Salaire ${periodMonth} — ${name}`,
      paymentMethod: 'ESPECES',
      recordedBy: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Administrateur',
    });
    if (!recorded) return false;
    const { data: authData } = await supabase.auth.getUser();
    const payment: SalaryPayment = {
      id: `sal-${Date.now()}`,
      employeeId,
      employeeName: name,
      amount,
      periodMonth,
      status: 'PAYE',
      paidAt: paidAtIso,
    };
    const { error } = await supabase.from('salary_payments').insert({
      id: payment.id,
      employee_id: employeeId,
      employee_name: name,
      amount,
      period_month: periodMonth,
      status: 'PAYE',
      recorded_by: authData.user?.id || currentUser?.auth_user_id || null,
      paid_at: payment.paidAt,
    });
    if (error) {
      addNotification(`Salaire enregistré en dépense, mais le suivi RH a échoué : ${error.message}. Exécutez supabase/stock-management.sql.`, 'warning');
    } else {
      setSalaryPayments(previous => [payment, ...previous]);
    }
    return true;
  }, [employees, salaryPayments, recordExpense, currentUser, addNotification]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>): Promise<boolean> => {
    const existing = expenses.find(expense => expense.id === id);
    if (!existing) return false;
    const updated = { ...existing, ...updates };
    const result = await persistExpenseUpdate(id, {
      category: updated.category,
      item_name: updated.itemName || null,
      quantity: expenseQuantityOrNull(updated.quantity),
      unit: updated.unit || null,
      description: updated.description,
      amount: updated.amount,
      payment_method: updated.paymentMethod,
      supplier: updated.supplier || null,
      reference: updated.reference || updated.unit || null,
      expense_date: updated.date,
      created_at: updated.createdAt,
      service: updated.service,
    });
    if (!result.ok) {
      addNotification(`Dépense non modifiée dans Supabase : ${result.message}`, 'error');
      return false;
    }
    setExpenses(prev => prev.map(expense => expense.id === id ? updated : expense));
    logAudit('MODIFICATION_DEPENSE', 'Expense', id, JSON.stringify(existing), JSON.stringify(updated), `Modification dépense ${updated.description}`);
    addNotification('Dépense mise à jour dans la base.', 'info');
    return true;
  }, [expenses, logAudit, addNotification]);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    const { data, error } = await supabase.from('expenses').delete().eq('id', id).select('id');
    if (error) {
      addNotification(`Dépense non supprimée de Supabase : ${error.message}`, 'error');
      return false;
    }
    if (!data?.length) {
      addNotification('Suppression refusée par Supabase. Exécutez supabase/expenses-persist.sql dans l’éditeur SQL.', 'error');
      return false;
    }
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    logAudit('SUPPRESSION_DEPENSE', 'Expense', id, undefined, undefined, 'Dépense supprimée');
    addNotification('Dépense supprimée de la base.', 'warning');
    return true;
  }, [logAudit, addNotification]);

  const addExpenseCategory = useCallback(async (name: string, iconName = 'Tag'): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const existing = expenseCategories.find(item => item.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      addNotification(`La catégorie « ${existing.name} » existe déjà.`, 'info');
      return true;
    }
    const newCat: ExpenseCategory = {
      id: 'exp-cat-' + Date.now(),
      name: trimmed,
      iconName,
      isDefault: false,
    };
    const { error } = await supabase.from('expense_categories').insert({
      id: newCat.id,
      name: newCat.name,
      icon_name: iconName,
      is_default: false,
    });
    if (error) {
      addNotification(`Catégorie non enregistrée dans Supabase : ${error.message}`, 'error');
      return false;
    }
    setExpenseCategories(prev => [...prev, newCat]);
    addNotification(`Catégorie de dépense « ${trimmed} » ajoutée.`, 'success');
    return true;
  }, [expenseCategories, addNotification]);

  // Cash Register Management
  const openCashRegister = useCallback((openingBalance: number, openedBy: string) => {
    const newSession: CashRegisterSession = {
      id: 'cash-sess-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      openedAt: new Date().toISOString(),
      openingBalance,
      openedBy,
      status: 'OPEN',
      totalSalesCash: 0,
      totalSalesMobile: 0,
      totalSalesCard: 0,
      totalSalesBank: 0,
      totalExpenses: 0,
      theoreticalBalance: openingBalance,
    };

    void supabase.from('cash_register_sessions').insert({ id: newSession.id, opened_by: currentUser?.auth_user_id || null, opened_at: newSession.openedAt, opening_balance: openingBalance, status: 'OPEN' }).then(({ error }) => {
      if (error) {
        addNotification(`Ouverture de caisse refusée par Supabase : ${error.message}`, 'error');
        return;
      }
      setCashRegister(newSession);
      logAudit('OUVERTURE_CAISSE', 'CashRegisterSession', newSession.id, undefined, `Fond de caisse: ${openingBalance} FC`, `Ouverture par ${openedBy}`);
      addNotification(`Caisse ouverte avec un fond initial de ${openingBalance} FC.`, 'success');
    });
  }, [currentUser, logAudit, addNotification]);

  const closeCashRegister = useCallback((
    realCount: number,
    justification: string,
    closedBy: string,
    notes?: string
  ): CashRegisterSession => {
    const variance = realCount - cashRegister.theoreticalBalance;
    const closedSession: CashRegisterSession = {
      ...cashRegister,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy,
      realBalance: realCount,
      variance,
      varianceReason: justification,
      notes,
    };

    void supabase.from('cash_register_sessions').update({ status: 'CLOSED', closed_by: currentUser?.auth_user_id || null, closed_at: closedSession.closedAt, real_balance: realCount, variance, variance_reason: justification || null, notes: notes || null }).eq('id', closedSession.id).then(({ error }) => {
      if (error) {
        addNotification(`Clôture non enregistrée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setCashRegister(closedSession);
      setCashClosuresHistory(prev => [closedSession, ...prev]);
      logAudit('CLOTURE_CAISSE', 'CashRegisterSession', closedSession.id, `Théorique: ${cashRegister.theoreticalBalance} FC`, `Réel: ${realCount} FC (Écart: ${variance} FC)`, `Clôture validée par ${closedBy}. ${justification ? `Justification: ${justification}` : 'Aucun écart.'}`);
      addNotification(`Clôture de caisse effectuée. Écart: ${variance} FC.`, variance === 0 ? 'success' : 'warning');
    });
    return closedSession;
  }, [cashRegister, currentUser, logAudit, addNotification]);

  const updateRestaurantInfo = useCallback((info: Partial<RestaurantInfo>) => {
    setRestaurantInfo(prev => ({ ...prev, ...info }));
    addNotification('Coordonnées du restaurant mises à jour.', 'success');
  }, [addNotification]);

  const resetToInitialData = useCallback(() => {
    setRestaurantInfo(initialRestaurantInfo);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setTables(initialTables);
    setOrders(initialOrders);
    setTableSessions(initialTableSessions);
    setInvoices(initialInvoices);
    setPaymentTransactions([]);
    setEmployees(initialEmployees);
    setAttendanceRecords(initialAttendanceRecords);
    setExpenseCategories(initialExpenseCategories);
    setExpenses(initialExpenses);
    setCashRegister(initialCashRegisterSession);
    setCashClosuresHistory([]);
    setAuditLogs(initialAuditLogs);
    addNotification('Données réinitialisées avec succès.', 'info');
  }, [addNotification]);

  return (
    <RestaurantContext.Provider
      value={{
        currentRole,
        currentUser,
        authLoading,
        authEmail,
        selectedTableId,
        restaurantInfo,
        categories,
        products,
        ingredients,
        recipeIngredients,
        kitchenPreparations,
        stockMovements,
        salaryPayments,
        tables,
        orders,
        tableSessions,
        invoices,
        paymentTransactions,
        employees,
        attendanceRecords,
        expenseCategories,
        expenses,
        cashRegister,
        cashClosuresHistory,
        auditLogs,
        notifications,

        setCurrentRole,
        setCurrentUser,
        switchRole,
        signIn,
        signOut,
        setSelectedTableId,

        placeClientOrder,
        updateOrderStatus,
        cancelOrder,

        openTableSession,
        updateTableStatus,
        addTable,
        updateTable,
        deleteTable,

        generateInvoiceForTable,
        generateInvoiceForOrders,
        recordPayment,
        cancelPaidSale,

        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        addIngredient,
        setRecipeIngredient,
        removeRecipeIngredient,
        recordKitchenPreparation,
        applyStockMovement,
        updateStockItem,
        payEmployeeSalary,
        addCategory,
        updateCategory,
        deleteCategory,

        addEmployee,
        createStaffAccount,
        updateEmployee,
        deleteEmployee,
        clockCurrentUserAttendance,
        correctAttendance,

        recordExpense,
        updateExpense,
        deleteExpense,
        addExpenseCategory,

        openCashRegister,
        closeCashRegister,

        updateRestaurantInfo,
        addNotification,
        removeNotification,
        resetToInitialData,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
