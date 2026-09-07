export type UserRole = 
  | 'CLIENT' 
  | 'SERVEUR' 
  | 'CAISSIER' 
  | 'CUISINE' 
  | 'EMPLOYE' 
  | 'POINTAGE'
  | 'RESPONSABLE' 
  | 'ADMINISTRATEUR';

export type EmployeePosition = 
  | 'Gérant' 
  | 'Responsable' 
  | 'Caissier' 
  | 'Serveur' 
  | 'Cuisinier' 
  | 'Aide-cuisinier' 
  | 'Nettoyage' 
  | 'Livreur' 
  | 'Autre'
  | string;

export type ContractType = 'CDI' | 'CDD' | 'Journalier' | 'Stage' | 'EXTRA' | string;

export type EmployeeStatus = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'CONGE';

export interface Employee {
  id: string;
  auth_user_id?: string;
  matricule: string; // e.g. EMP-001
  nom: string;
  postnom?: string;
  prenom: string;
  telephone: string;
  email?: string;
  role?: UserRole;
  poste: string;
  salaire: number; // in CNY
  salaireBase?: number; // in CNY (alias)
  dateEmbauche: string;
  typeContrat: ContractType;
  statut: EmployeeStatus;
  photo: string;
  pin: string; // 4 digits
  scheduledShiftStart: string; // e.g. "08:00"
  scheduledShiftEnd: string; // e.g. "17:00"
}

export type AttendanceType = 'ENTREE' | 'DEBUT_PAUSE' | 'FIN_PAUSE' | 'SORTIE';

export type AttendanceStatus = 'PRESENT' | 'RETARD' | 'ABSENT' | 'CONGE' | 'REPOS';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  matricule: string;
  employeeName: string;
  employeePhoto: string;
  employeePosition: EmployeePosition;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  type: AttendanceType;
  timestamp: number;
  scheduledTime: string; // HH:mm
  delayMinutes: number; // calculated delay
  status: AttendanceStatus;
  isManualCorrection?: boolean;
  correctedBy?: string;
  correctionReason?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  iconName: string;
  order: number;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in CNY
  photo: string;
  available: boolean;
  isRecommended: boolean;
  order: number;
  preparationTimeMinutes: number;
  spicyLevel?: number; // 0 to 3
  tags?: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  lastExpenseId?: string;
}

export interface RecipeIngredient {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
}

export type TableStatus = 'LIBRE' | 'OCCUPEE' | 'COMMANDE_EN_COURS' | 'A_PAYER' | 'NETTOYAGE';

export type TableZone = 'Salle Principale' | 'Terrasse' | 'Salon VIP' | 'Jardin' | 'Bar';

export interface RestaurantTable {
  id: string;
  code: string; // e.g. "Table 01", "VIP 01"
  name: string;
  zone: TableZone;
  capacity: number;
  status: TableStatus;
  currentSessionId?: string;
  waiterName?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number; // Snapshot of price at order time
  quantity: number;
  notes?: string;
  subtotal: number;
}

export type OrderStatus = 'NOUVELLE' | 'ACCEPTEE' | 'EN_PREPARATION' | 'PRETE' | 'SERVIE' | 'PAYEE' | 'ANNULEE';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#1001"
  restaurantId: string;
  tableId: string;
  tableCode: string;
  sessionId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string; // ISO string
  preparedAt?: string;
  servedAt?: string;
  specialInstructions?: string;
  clientName?: string;
  orderType: 'SUR_PLACE' | 'A_EMPORTER';
}

export interface TableSession {
  id: string;
  tableId: string;
  tableCode: string;
  openedAt: string;
  closedAt?: string;
  status: 'ACTIVE' | 'CLOSED';
  orderIds: string[];
  totalAmount: number;
  paidAmount: number;
  waiterName?: string;
  customerCount: number;
}

export type PaymentMethod =
  | 'ESPECES'
  | 'WECHAT'
  | 'ALIPAY'
  | 'BANQUE'
  | 'CARTE'
  | 'AUTRE'
  | 'QR_CODE'
  | 'M_PESA'
  | 'AIRTEL_MONEY'
  | 'ORANGE_MONEY';

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  tableId: string;
  tableCode: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
  createdAt: string;
  cashierName: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "FACT-2026-0001"
  sessionId: string;
  tableId: string;
  tableCode: string;
  orderIds: string[];
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'EN_ATTENTE' | 'PAYEE' | 'ANNULEE';
  createdAt: string;
  paidAt?: string;
  cashierName: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  iconName: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  service: 'CUISINE' | 'CAISSE' | 'ADMINISTRATION';
  category: string;
  itemName?: string;
  quantity?: number;
  description: string;
  amount: number; // in CNY
  paymentMethod: PaymentMethod;
  supplier?: string;
  reference?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: string;
}

export interface CashRegisterSession {
  id: string;
  date: string; // YYYY-MM-DD
  openedAt: string;
  openingBalance: number; // in CNY
  openedBy: string;
  status: 'OPEN' | 'CLOSED';
  closedAt?: string;
  closedBy?: string;
  totalSalesCash: number;
  totalSalesMobile: number;
  totalSalesCard: number;
  totalSalesBank: number;
  totalExpenses: number;
  theoreticalBalance: number;
  realBalance?: number;
  variance?: number; // realBalance - theoreticalBalance
  varianceReason?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  date: string;
  time: string;
  targetEntity: string;
  targetId: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface RestaurantInfo {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  nifRccm: string;
  tableCount: number;
}
