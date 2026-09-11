import { Expense, Ingredient, Invoice, KitchenPreparation, Order, Product, RecipeIngredient, StockMovement } from '../types';
import { isPurchaseCategory, normalizeItemName } from './expenseCatalog';

export type ReportPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export interface PeriodRange {
  start: Date;
  end: Date;
}

export function periodRange(period: ReportPeriod, customStart = '', customEnd = ''): PeriodRange {
  const end = period === 'CUSTOM' && customEnd ? new Date(`${customEnd}T23:59:59`) : new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  if (period === 'WEEK') start.setDate(start.getDate() - 6);
  else if (period === 'MONTH') start.setDate(start.getDate() - 29);
  else if (period === 'CUSTOM' && customStart) return { start: new Date(`${customStart}T00:00:00`), end };
  return { start, end };
}

export function inRange(isoDate: string, range: PeriodRange): boolean {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return false;
  return time >= range.start.getTime() && time <= range.end.getTime();
}

/** Compare YYYY-MM-DD in local calendar days (avoids UTC shifting date-only strings). */
export function calendarDateInRange(dateStr: string | undefined, range: PeriodRange): boolean {
  if (!dateStr) return false;
  const day = String(dateStr).slice(0, 10);
  const parts = day.split('-').map(Number);
  if (parts.length < 3 || parts.some(n => Number.isNaN(n))) return inRange(dateStr, range);
  const [year, month, dayNum] = parts;
  const time = new Date(year, month - 1, dayNum).setHours(0, 0, 0, 0);
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  return time >= start.getTime() && time <= end.getTime();
}

export function localDateTimeToIso(dateStr: string, timeStr: string): string {
  const [year, month, dayNum] = dateStr.slice(0, 10).split('-').map(Number);
  const [hours, minutes] = (timeStr || '12:00').split(':').map(Number);
  if (!year || !month || !dayNum) return new Date().toISOString();
  return new Date(year, month - 1, dayNum, hours || 0, minutes || 0, 0, 0).toISOString();
}

export function paidProductSales(invoices: Invoice[], orders: Order[], range: PeriodRange) {
  const map = new Map<string, { productName: string; quantity: number; revenue: number }>();
  const add = (productId: string, productName: string, quantity: number, revenue: number) => {
    const key = productId || productName;
    const existing = map.get(key) || { productName, quantity: 0, revenue: 0 };
    existing.quantity += quantity;
    existing.revenue += revenue;
    if (productName) existing.productName = productName;
    map.set(key, existing);
  };
  const countedOrderIds = new Set<string>();
  invoices
    .filter(invoice => invoice.status === 'PAYEE' && inRange(invoice.paidAt || invoice.createdAt, range))
    .forEach(invoice => {
      (invoice.orderIds || []).forEach(id => countedOrderIds.add(id));
      const related = orders.filter(order => (invoice.orderIds || []).includes(order.id));
      related.forEach(order => {
        order.items.forEach(item => add(item.productId, item.productName, item.quantity, item.subtotal));
      });
    });
  orders
    .filter(order => order.status === 'PAYEE' && !countedOrderIds.has(order.id) && inRange(order.servedAt || order.createdAt, range))
    .forEach(order => {
      order.items.forEach(item => add(item.productId, item.productName, item.quantity, item.subtotal));
    });
  return map;
}

export function findIngredientByName(name: string, ingredients: Ingredient[]): Ingredient | undefined {
  const key = normalizeItemName(name);
  if (!key) return undefined;
  return ingredients.find(item => {
    const candidate = normalizeItemName(item.name);
    return candidate === key || candidate.includes(key) || key.includes(candidate);
  });
}

export function portionCost(productId: string, ingredients: Ingredient[], recipes: RecipeIngredient[]): number {
  return recipes
    .filter(item => item.productId === productId)
    .reduce((sum, item) => {
      const ingredient = ingredients.find(row => row.id === item.ingredientId);
      return sum + item.quantity * Number(ingredient?.unitCost || 0);
    }, 0);
}

export function paidSalesTotal(invoices: Invoice[], range: PeriodRange): number {
  return invoices
    .filter(invoice => invoice.status === 'PAYEE' && inRange(invoice.paidAt || invoice.createdAt, range))
    .reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0);
}

export function soldItems(orders: Order[], range: PeriodRange) {
  const sold: { productId: string; productName: string; quantity: number; revenue: number }[] = [];
  const map = new Map<string, { productName: string; quantity: number; revenue: number }>();
  orders
    .filter(order => order.status !== 'ANNULEE' && ['PAYEE', 'SERVIE', 'PRETE'].includes(order.status) && inRange(order.createdAt, range))
    .forEach(order => {
      order.items.forEach(item => {
        const existing = map.get(item.productId) || { productName: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
        map.set(item.productId, existing);
      });
    });
  map.forEach((value, productId) => sold.push({ productId, ...value }));
  return sold;
}

export function estimatedCogs(
  orders: Order[],
  ingredients: Ingredient[],
  recipes: RecipeIngredient[],
  range: PeriodRange
): number {
  return soldItems(orders, range).reduce((sum, item) => sum + portionCost(item.productId, ingredients, recipes) * item.quantity, 0);
}

export function buildProfitSnapshot(input: {
  invoices: Invoice[];
  expenses: Expense[];
  orders: Order[];
  products: Product[];
  categories: { id: string; name: string }[];
  ingredients: Ingredient[];
  recipes: RecipeIngredient[];
  preparations: KitchenPreparation[];
  range: PeriodRange;
  stockRange?: PeriodRange;
}) {
  const range = input.range;
  const stockRange = input.stockRange || { start: new Date(0), end: range.end };
  const sales = paidSalesTotal(input.invoices, range);
  const periodExpenses = input.expenses.filter(expense => calendarDateInRange(expense.date, range) || (!expense.date && inRange(expense.createdAt, range)));
  const purchaseSpend = periodExpenses.filter(expense => isPurchaseCategory(expense.category)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const operatingSpend = periodExpenses.filter(expense => !isPurchaseCategory(expense.category)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totalExpenses = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const sold = soldItems(input.orders, range);
  const cogs = estimatedCogs(input.orders, input.ingredients, input.recipes, range);
  const drinkCategoryIds = new Set(input.categories.filter(category => /boisson/i.test(category.name)).map(category => category.id));
  const drinksSold = sold
    .filter(item => drinkCategoryIds.has(input.products.find(product => product.id === item.productId)?.categoryId || ''))
    .reduce((sum, item) => sum + item.quantity, 0);
  const dishesSold = sold.reduce((sum, item) => sum + item.quantity, 0);
  const dishesPrepared = input.preparations
    .filter(prep => inRange(prep.preparedAt, range))
    .reduce((sum, prep) => sum + Number(prep.quantity || 0), 0);

  const stockRows = input.ingredients.map(ingredient => {
    const purchased = input.expenses
      .filter(expense => isPurchaseCategory(expense.category) && expense.quantity && findIngredientByName(expense.itemName || expense.description, [ingredient]))
      .filter(expense => calendarDateInRange(expense.date, stockRange))
      .reduce((sum, expense) => sum + Number(expense.quantity || 0), 0);
    const consumedFromPrep = input.preparations
      .filter(prep => inRange(prep.preparedAt, stockRange))
      .reduce((sum, prep) => {
        const recipeQty = input.recipes.find(recipe => recipe.productId === prep.productId && recipe.ingredientId === ingredient.id)?.quantity || 0;
        return sum + recipeQty * Number(prep.quantity || 0);
      }, 0);
    const consumedFromSales = soldItems(input.orders, stockRange)
      .reduce((sum, item) => {
        const recipeQty = input.recipes.find(recipe => recipe.productId === item.productId && recipe.ingredientId === ingredient.id)?.quantity || 0;
        return sum + recipeQty * item.quantity;
      }, 0);
    const consumed = consumedFromPrep > 0 ? consumedFromPrep : consumedFromSales;
    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      unitCost: ingredient.unitCost,
      purchased,
      consumed,
      remaining: Math.max(0, purchased - consumed),
    };
  }).filter(row => row.purchased > 0 || row.consumed > 0);

  return {
    sales,
    purchaseSpend,
    operatingSpend,
    totalExpenses,
    cogs,
    grossMargin: sales - cogs,
    estimatedResult: sales - cogs - operatingSpend,
    dishesSold,
    drinksSold,
    dishesPrepared: dishesPrepared || dishesSold,
    sold,
    stockRows,
    periodExpenses,
  };
}

export function servedProductSales(orders: Order[], range: PeriodRange) {
  const map = new Map<string, { productName: string; quantity: number }>();
  orders
    .filter(order => ['SERVIE', 'PAYEE'].includes(order.status) && inRange(order.servedAt || order.createdAt, range))
    .forEach(order => {
      order.items.forEach(item => {
        const key = item.productId || item.productName;
        const existing = map.get(key) || { productName: item.productName, quantity: 0 };
        existing.quantity += item.quantity;
        map.set(key, existing);
      });
    });
  return map;
}

export function preparedProductSales(preparations: KitchenPreparation[], range: PeriodRange) {
  const map = new Map<string, { productName: string; quantity: number }>();
  preparations.filter(prep => inRange(prep.preparedAt, range)).forEach(prep => {
    const key = prep.productId || prep.productName;
    const existing = map.get(key) || { productName: prep.productName, quantity: 0 };
    existing.quantity += Number(prep.quantity || 0);
    map.set(key, existing);
  });
  return map;
}

export function ingredientPeriodFlow(ingredients: Ingredient[], movements: StockMovement[], expenses: Expense[], range: PeriodRange, options?: { resetCycle?: boolean }) {
  return ingredients.map(ingredient => {
    const periodMoves = movements.filter(movement => movement.ingredientId === ingredient.id && inRange(movement.createdAt, range));
    const entries = periodMoves.filter(movement => movement.movementType === 'ENTREE').reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const exits = periodMoves.filter(movement => movement.movementType === 'SORTIE').reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const purchased = expenses
      .filter(expense => isPurchaseCategory(expense.category) && expense.quantity && findIngredientByName(expense.itemName || expense.description, [ingredient]) && calendarDateInRange(expense.date, range))
      .reduce((sum, expense) => sum + Number(expense.quantity || 0), 0);
    const liveQty = Number(ingredient.stockQty || 0);
    const remaining = options?.resetCycle ? Math.max(0, (entries || purchased) - exits) : liveQty;
    const hasLedger = periodMoves.length > 0;
    const initial = options?.resetCycle ? 0 : (hasLedger ? liveQty - entries + exits : liveQty);
    const theoreticalRemaining = initial + (entries || purchased) - exits;
    const variance = options?.resetCycle ? 0 : remaining - theoreticalRemaining;
    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      unitCost: Number(ingredient.unitCost || 0),
      initial,
      purchased: entries || purchased,
      consumed: exits,
      remaining,
      remainingValue: remaining * Number(ingredient.unitCost || 0),
      hasLedger,
      theoreticalRemaining,
      variance,
    };
  }).filter(row => {
    if (options?.resetCycle) return row.purchased > 0 || row.consumed > 0 || row.remaining > 0;
    return row.remaining > 0 || row.purchased > 0 || row.consumed > 0 || row.initial > 0;
  });
}
