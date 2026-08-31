import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserRole,
  Employee,
  RestaurantInfo,
  Category,
  Product,
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
import { playNotificationSound } from '../utils/formatters';
import { supabase } from '../lib/supabase';

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
  ) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  cancelOrder: (orderId: string, reason?: string) => void;

  // Tables & Sessions
  openTableSession: (tableId: string, customerCount: number, waiterName?: string) => TableSession;
  updateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  addTable: (table: Omit<RestaurantTable, 'id'>) => void;
  updateTable: (id: string, updates: Partial<RestaurantTable>) => void;
  deleteTable: (id: string) => void;

  // Invoices & Payments (Cashier)
  generateInvoiceForTable: (tableId: string, cashierName: string, discountAmount?: number) => Invoice | null;
  recordPayment: (
    invoiceId: string, 
    amountPaid: number, 
    method: PaymentMethod, 
    reference?: string, 
    note?: string
  ) => { success: boolean; isFullyPaid: boolean; remaining: number };

  // Menu & Products
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Staff & Attendance
  addEmployee: (emp: Omit<Employee, 'id' | 'matricule'>) => void;
  createStaffAccount: (data: { email: string; password: string; role: UserRole; employee: Omit<Employee, 'id' | 'matricule' | 'auth_user_id'> }) => Promise<{ success: boolean; message: string }>;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  clockAttendance: (
    matricule: string, 
    pin: string, 
    type: AttendanceType
  ) => { success: boolean; message: string; record?: AttendanceRecord; employee?: Employee };
  correctAttendance: (recordId: string, newStatus: AttendanceStatus, reason: string, adminName: string) => void;

  // Expenses
  recordExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addExpenseCategory: (name: string, iconName?: string) => void;

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

const productFromSupabase = (row: SupabaseProductRow): Product => ({
  id: row.id,
  categoryId: row.category_id || '',
  name: row.name,
  description: row.description,
  price: Number(row.price),
  photo: row.photo,
  available: row.available,
  isRecommended: row.is_recommended,
  order: row.display_order,
  preparationTimeMinutes: row.preparation_time_minutes,
  spicyLevel: row.spicy_level,
  tags: row.tags || [],
});

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

  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(() => 
    loadFromStorage('info', initialRestaurantInfo)
  );

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

  const [cashRegister, setCashRegister] = useState<CashRegisterSession>(() => 
    loadFromStorage('cashRegister', initialCashRegisterSession)
  );

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
      const linkedEmployee = employees.find(employee => employee.auth_user_id === userId);
      setCurrentRole(role);
      setCurrentUser(linkedEmployee || null);
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
  }, [employees]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { success: false, message: error?.message || 'Connexion refusée.' };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { success: false, message: 'Profil utilisateur introuvable.' };
    }

    return { success: true, message: 'Connexion réussie.', role: profile.role as UserRole };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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
        setProducts((data as SupabaseProductRow[]).map(productFromSupabase));
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
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
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

      if (categoriesResult.data) setCategories(categoriesResult.data.map((row: any) => ({ id: row.id, name: row.name, description: row.description || undefined, iconName: row.icon_name, order: row.display_order, active: row.active })));
      if (productsResult.data) setProducts(productsResult.data.map(productFromSupabase));
      if (tablesResult.data) setTables(tablesResult.data.map(tableFromSupabase));
      if (sessionsResult.data) setTableSessions(sessionsResult.data.map((row: any) => ({ id: row.id, tableId: row.table_id, tableCode: (tablesResult.data || []).find((table: any) => table.id === row.table_id)?.code || row.table_id, openedAt: row.opened_at, closedAt: row.closed_at || undefined, status: row.status, orderIds: (ordersResult.data || []).filter((order: any) => order.table_session_id === row.id).map((order: any) => order.id), totalAmount: Number(row.total_amount), paidAmount: Number(row.paid_amount), customerCount: row.customer_count })));
      if (ordersResult.data) setOrders(ordersResult.data.map((row: any) => ({ id: row.id, orderNumber: row.order_number, restaurantId: 'resto-umoja', tableId: row.table_id, tableCode: (tablesResult.data || []).find((table: any) => table.id === row.table_id)?.code || '', sessionId: row.table_session_id || '', items: (itemsByOrder.get(row.id) || []).map(item => ({ id: item.id, productId: item.product_id || '', productName: item.product_name, unitPrice: Number(item.unit_price), quantity: item.quantity, notes: item.notes || undefined, subtotal: Number(item.subtotal) })), totalAmount: Number(row.total_amount), status: row.status, createdAt: row.created_at, preparedAt: row.prepared_at || undefined, servedAt: row.served_at || undefined, specialInstructions: row.special_instructions || undefined, clientName: row.client_name || undefined, orderType: row.order_type })));
      if (employeesResult.data) setEmployees(loadedEmployees);
      if (attendanceResult.data) setAttendanceRecords(attendanceResult.data.map((row: any) => {
        const employee = employeeById.get(row.employee_id);
        return { id: row.id, employeeId: row.employee_id, matricule: employee?.matricule || '', employeeName: employee ? `${employee.prenom} ${employee.nom}` : 'Employé inconnu', employeePhoto: employee?.photo || '', employeePosition: employee?.poste || '', date: row.date, time: row.time, type: row.type, timestamp: new Date(row.created_at).getTime(), scheduledTime: employee?.scheduledShiftStart || '', delayMinutes: row.delay_minutes, status: row.status, isManualCorrection: row.is_manual_correction, correctionReason: row.correction_reason };
      }));
      if (expensesResult.data) setExpenses(expensesResult.data.map((row: any) => ({ id: row.id, date: row.expense_date, category: row.category, description: row.description, amount: Number(row.amount), paymentMethod: row.payment_method, supplier: row.supplier || undefined, reference: row.reference || undefined, recordedBy: row.recorded_by || 'Utilisateur autorisé', createdAt: row.created_at })));
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
  const placeClientOrder = useCallback((
    tableId: string,
    items: { product: Product; quantity: number; notes?: string }[],
    clientName?: string,
    specialInstructions?: string
  ): Order => {
    const table = tables.find(t => t.id === tableId) || tables[0];
    const orderNumber = '#' + (1000 + orders.length + 1);
    
    // Find or create table session
    let session = tableSessions.find(s => s.tableId === table.id && s.status === 'ACTIVE');
    let sessionId = session?.id;

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
      setTableSessions(prev => [session!, ...prev]);
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

    // Update orders list
    setOrders(prev => [newOrder, ...prev]);

    // Persist the public client order in Supabase without exposing internal data.
    void (async () => {
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
      const { error: sessionError } = await supabase.from('table_sessions').upsert(sessionPayload, { onConflict: 'id' });
      if (sessionError) {
        addNotification(`Commande non synchronisée avec Supabase : ${sessionError.message}`, 'error');
        return;
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
      if (orderError) {
        addNotification(`Commande non synchronisée avec Supabase : ${orderError.message}`, 'error');
        return;
      }
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
      if (itemsError) addNotification(`Articles non synchronisés avec Supabase : ${itemsError.message}`, 'error');
    })();

    // Update session orders & total
    setTableSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          orderIds: [...s.orderIds, newOrder.id],
          totalAmount: s.totalAmount + totalAmount,
        };
      }
      return s;
    }));

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
      served_at: newStatus === 'SERVIE' ? now : undefined,
    }).eq('id', orderId).then(({ error }) => {
      if (error) addNotification(`Statut non synchronisé avec Supabase : ${error.message}`, 'error');
    });
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const oldStatus = ord.status;
        const updated: Order = {
          ...ord,
          status: newStatus,
          preparedAt: newStatus === 'PRETE' ? new Date().toISOString() : ord.preparedAt,
          servedAt: newStatus === 'SERVIE' ? new Date().toISOString() : ord.servedAt,
        };
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
  }, [logAudit, addNotification]);

  // Cancel order
  const cancelOrder = useCallback((orderId: string, reason?: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        logAudit('ANNULATION_COMMANDE', 'Order', orderId, ord.status, 'ANNULEE', reason || 'Annulation manuelle');
        addNotification(`Commande ${ord.orderNumber} annulée.`, 'error');
        return { ...ord, status: 'ANNULEE' };
      }
      return ord;
    }));
  }, [logAudit, addNotification]);

  // Open Table Session
  const openTableSession = useCallback((tableId: string, customerCount: number, waiterName?: string): TableSession => {
    const table = tables.find(t => t.id === tableId);
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
  }, [tables, logAudit, addNotification]);

  // Update table status
  const updateTableStatus = useCallback((tableId: string, status: RestaurantTable['status']) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const oldStatus = t.status;
        logAudit('STATUT_TABLE', 'RestaurantTable', tableId, oldStatus, status, `Changement statut ${t.code}`);
        return { ...t, status };
      }
      return t;
    }));
  }, [logAudit]);

  // Generate Invoice For Table Session (Grouped Orders)
  const generateInvoiceForTable = useCallback((tableId: string, cashierName: string, discountAmount = 0): Invoice | null => {
    const session = tableSessions.find(s => s.tableId === tableId && s.status === 'ACTIVE');
    if (!session) {
      addNotification('Aucune session active trouvée pour cette table.', 'warning');
      return null;
    }

    const sessionOrders = orders.filter(o => session.orderIds.includes(o.id) && o.status !== 'ANNULEE');
    if (sessionOrders.length === 0) {
      addNotification('Aucune commande enregistrée pour cette table.', 'warning');
      return null;
    }

    // Regroup items from all orders into consolidated invoice items
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
    const subtotal = consolidatedItems.reduce((acc, i) => acc + i.subtotal, 0);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const invoiceNumber = `FACT-2026-${String(invoices.length + 1).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      sessionId: session.id,
      tableId,
      tableCode: session.tableCode,
      orderIds: session.orderIds,
      items: consolidatedItems,
      subtotal,
      discountAmount,
      taxAmount: 0, // In RDC restaurant prices are standardly TTC
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
      table_session_id: newInvoice.sessionId,
      table_id: newInvoice.tableId,
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

    // Mark table as A_PAYER
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'A_PAYER' } : t));
    void supabase.from('restaurant_tables').update({ status: 'A_PAYER' }).eq('id', tableId);

    logAudit('GENERATION_FACTURE', 'Invoice', newInvoice.id, undefined, `${invoiceNumber} - Total: ${finalTotal} CNY`, `Facture générée pour ${session.tableCode}`);
    addNotification(`Facture ${invoiceNumber} (${session.tableCode}) générée avec succès !`, 'success');

    return newInvoice;
  }, [tableSessions, orders, invoices.length, currentUser, logAudit, addNotification]);

  // Record Payment
  const recordPayment = useCallback((
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

    setPaymentTransactions(prev => [transaction, ...prev]);
    void supabase.from('payments').insert({
      id: transaction.id,
      invoice_id: invoiceId,
      amount: amountPaid,
      payment_method: method,
      reference: reference || null,
      note: note || null,
      recorded_by: currentUser?.auth_user_id || null,
      created_at: transaction.createdAt,
    }).then(({ error }) => {
      if (error) addNotification(`Paiement non enregistré dans Supabase : ${error.message}`, 'error');
    });
    void supabase.from('invoices').update({
      paid_amount: newPaidAmount,
      status: isFullyPaid ? 'PAYEE' : 'EN_ATTENTE',
      paid_at: isFullyPaid ? new Date().toISOString() : null,
      payment_method: method,
      payment_reference: reference || null,
    }).eq('id', invoiceId);

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
      const isMobile = ['M_PESA', 'AIRTEL_MONEY', 'ORANGE_MONEY'].includes(method);
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

      logAudit('PAIEMENT_TOTAL_FACTURE', 'Invoice', invoiceId, 'EN_ATTENTE', 'PAYEE', `Paiement total reçu de ${amountPaid} FC via ${method}. Table ${invoice.tableCode} libérée.`);
      addNotification(`Paiement de ${amountPaid} FC reçu. Facture ${invoice.invoiceNumber} SOLDÉE. Table libérée !`, 'success');
      playNotificationSound('success');
    } else {
      logAudit('PAIEMENT_PARTIEL_FACTURE', 'Invoice', invoiceId, undefined, `Acompte: ${amountPaid} FC, Reste: ${remaining} FC`, `Paiement partiel pour ${invoice.tableCode}`);
      addNotification(`Acompte de ${amountPaid} FC enregistré. Reste à payer: ${remaining} FC`, 'info');
    }

    return { success: true, isFullyPaid, remaining };
  }, [invoices, currentUser, logAudit, addNotification]);

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

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const existing = products.find(product => product.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    const { error } = await supabase.from('products').update(productToSupabase(updated)).eq('id', id);
    if (error) {
      addNotification(`Produit non modifié dans Supabase : ${error.message}`, 'error');
      return;
    }
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        logAudit('MODIFICATION_PRODUIT', 'Product', id, JSON.stringify(p), JSON.stringify(updated), `Mise à jour produit ${p.name}`);
        return updated;
      }
      return p;
    }));
    addNotification('Produit modifié avec succès.', 'info');
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
        logAudit('DISPONIBILITE_PRODUIT', 'Product', id, String(p.available), String(nextAvailable), `Disponibilité de ${p.name}: ${nextAvailable ? 'Disponible' : 'Épuisé'}`);
        addNotification(`${p.name} est désormais ${nextAvailable ? 'DISPONIBLE' : 'ÉPUISÉ'}.`, nextAvailable ? 'info' : 'warning');
        return { ...p, available: nextAvailable };
      }
      return p;
    }));
  }, [products, logAudit, addNotification]);

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

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    const existing = employees.find(employee => employee.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    void supabase.from('employees').update(employeeToSupabase(updated)).eq('id', id).then(({ error }) => {
      if (error) {
        addNotification(`Employé non modifié dans Supabase : ${error.message}`, 'error');
        return;
      }
      setEmployees(prev => prev.map(employee => employee.id === id ? updated : employee));
      logAudit('MODIFICATION_EMPLOYE', 'Employee', id, JSON.stringify(existing), JSON.stringify(updated), `Modification fiche de ${updated.prenom} ${updated.nom}`);
      addNotification('Fiche employé mise à jour.', 'info');
    });
  }, [employees, logAudit, addNotification]);

  const deleteEmployee = useCallback((id: string) => {
    void supabase.from('employees').update({ statut: 'INACTIF' }).eq('id', id).then(({ error }) => {
      if (error) {
        addNotification(`Employé non désactivé dans Supabase : ${error.message}`, 'error');
        return;
      }
      setEmployees(prev => prev.map(employee => employee.id === id ? { ...employee, statut: 'INACTIF' } : employee));
      logAudit('DESACTIVATION_EMPLOYE', 'Employee', id, undefined, 'INACTIF', 'Employé désactivé');
      addNotification('Employé désactivé.', 'warning');
    });
  }, [logAudit, addNotification]);

  // Attendance Clocking with Strict Delay Calculation & Official Photo
  const clockAttendance = useCallback((
    matricule: string,
    pin: string,
    type: AttendanceType
  ): { success: boolean; message: string; record?: AttendanceRecord; employee?: Employee } => {
    const emp = employees.find(e => e.matricule.trim().toUpperCase() === matricule.trim().toUpperCase());
    
    if (!emp) {
      return { success: false, message: 'Matricule introuvable. Veuillez vérifier votre identifiant.' };
    }

    if (emp.pin !== pin) {
      return { success: false, message: 'Code PIN incorrect.' };
    }

    if (emp.statut !== 'ACTIF') {
      return { success: false, message: `Cet employé est actuellement ${emp.statut}. Pointage refusé.` };
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const [currentHour, currentMin] = [now.getHours(), now.getMinutes()];
    const currentTotalMinutes = currentHour * 60 + currentMin;

    // Scheduled start time
    const [schedHour, schedMin] = (emp.scheduledShiftStart || '08:00').split(':').map(Number);
    const scheduledTotalMinutes = schedHour * 60 + schedMin;

    // Delay calculation
    let delayMinutes = 0;
    let status: AttendanceStatus = 'PRESENT';

    if (type === 'ENTREE') {
      if (currentTotalMinutes > scheduledTotalMinutes + 5) { // 5 minutes tolerance
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
      scheduledTime: emp.scheduledShiftStart,
      delayMinutes,
      status,
    };

    setAttendanceRecords(prev => [record, ...prev]);
    void supabase.from('attendance_records').insert({
      id: record.id,
      employee_id: record.employeeId,
      recorded_by: currentUser?.auth_user_id || null,
      date: record.date,
      time: record.time,
      type: record.type,
      status: record.status,
      delay_minutes: record.delayMinutes,
    }).then(({ error }) => {
      if (error) addNotification(`Pointage non enregistré dans Supabase : ${error.message}`, 'error');
    });

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

    return { success: true, message: msg, record, employee: emp };
  }, [employees, logAudit, addNotification]);

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
  const recordExpense = useCallback((data: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...data,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    void supabase.from('expenses').insert({ id: newExpense.id, category: newExpense.category, description: newExpense.description, amount: newExpense.amount, payment_method: newExpense.paymentMethod, supplier: newExpense.supplier || null, reference: newExpense.reference || null, recorded_by: currentUser?.auth_user_id || null, created_at: newExpense.createdAt, expense_date: newExpense.date }).then(({ error }) => {
      if (error) {
        addNotification(`Dépense non enregistrée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setExpenses(prev => [newExpense, ...prev]);

      if (data.paymentMethod === 'ESPECES') {
        setCashRegister(prev => {
          const updatedExpenses = prev.totalExpenses + data.amount;
          return { ...prev, totalExpenses: updatedExpenses, theoreticalBalance: prev.openingBalance + prev.totalSalesCash - updatedExpenses };
        });
      }

      logAudit('NOUVELLE_DEPENSE', 'Expense', newExpense.id, undefined, `${newExpense.amount} FC - ${newExpense.category}`, newExpense.description);
      addNotification(`Dépense de ${newExpense.amount} FC enregistrée (${newExpense.category}).`, 'info');
    });

    // If expense is paid in cash, adjust active cash register theoretical balance
  }, [currentUser, logAudit, addNotification]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const existing = expenses.find(expense => expense.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    void supabase.from('expenses').update({ category: updated.category, description: updated.description, amount: updated.amount, payment_method: updated.paymentMethod, supplier: updated.supplier || null, reference: updated.reference || null, expense_date: updated.date }).eq('id', id).then(({ error }) => {
      if (error) {
        addNotification(`Dépense non modifiée dans Supabase : ${error.message}`, 'error');
        return;
      }
      setExpenses(prev => prev.map(expense => expense.id === id ? updated : expense));
      logAudit('MODIFICATION_DEPENSE', 'Expense', id, JSON.stringify(existing), JSON.stringify(updated), `Modification dépense ${updated.description}`);
      addNotification('Dépense mise à jour.', 'info');
    });
  }, [expenses, logAudit, addNotification]);

  const deleteExpense = useCallback((id: string) => {
    void supabase.from('expenses').delete().eq('id', id).then(({ error }) => {
      if (error) {
        addNotification(`Dépense non supprimée de Supabase : ${error.message}`, 'error');
        return;
      }
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      logAudit('SUPPRESSION_DEPENSE', 'Expense', id, undefined, undefined, 'Dépense supprimée');
      addNotification('Dépense supprimée.', 'warning');
    });
  }, [logAudit, addNotification]);

  const addExpenseCategory = useCallback((name: string, iconName = 'Tag') => {
    const newCat: ExpenseCategory = {
      id: 'exp-cat-' + Date.now(),
      name,
      iconName,
      isDefault: false,
    };
    setExpenseCategories(prev => [...prev, newCat]);
    addNotification(`Catégorie de dépense "${name}" ajoutée.`, 'success');
  }, [addNotification]);

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
        recordPayment,

        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        addCategory,
        updateCategory,
        deleteCategory,

        addEmployee,
        createStaffAccount,
        updateEmployee,
        deleteEmployee,
        clockAttendance,
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
