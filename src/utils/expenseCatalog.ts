export const PURCHASE_CATEGORIES = [
  'Viandes',
  'Épices',
  'Légumes',
  'Divers',
  'Viande de bœuf ou Ngombe',
  'Tripe de bœuf ou Mabumu',
  'Poisson',
  'Poisson salé',
  'Viande de porc ou mipanzi',
  'Chèvre ou Ntaba',
  'Poulet',
  'Cuisse',
  'Maïs',
  'Boisson',
  'Riz',
] as const;

export const OPERATING_PARENT = 'Charges d’exploitation';

export const OPERATING_SUBCATEGORIES = ['Eau', 'Électricité', 'Transport'] as const;

export const SALARY_CATEGORY = 'Charges salariales';

export const EXPENSE_CATEGORY_OPTIONS = [
  ...PURCHASE_CATEGORIES,
  SALARY_CATEGORY,
  OPERATING_PARENT,
] as const;

export const EXPENSE_UNITS = ['kg', 'litre', 'pièce', 'sac', 'carton', 'botte', 'paquet', 'unité'] as const;

export const NEW_CATEGORY_VALUE = '__NEW_CATEGORY__';
export const OPERATING_PARENT_VALUE = OPERATING_PARENT;

const PURCHASE_ALIASES = new Set<string>([
  ...PURCHASE_CATEGORIES,
  'Viande',
  'Épices et condiments',
  'Viande de tripe ou Mabumu',
  'Riz / Semoule',
  'Huiles',
  'Boissons',
  'Farine / Maïs',
  'Chikwangue',
  'Autres achats alimentaires',
]);

const OPERATING_ALIASES = new Set<string>([
  SALARY_CATEGORY,
  OPERATING_PARENT,
  ...OPERATING_SUBCATEGORIES,
  'Entretien',
  'Loyer',
  'Électricité / Eau',
  'Autres',
  'Autres dépenses',
]);

export function isOperatingCategory(category: string): boolean {
  return OPERATING_ALIASES.has(category);
}

export function isPurchaseCategory(category: string): boolean {
  if (category === NEW_CATEGORY_VALUE) return true;
  if (PURCHASE_ALIASES.has(category)) return true;
  if (OPERATING_ALIASES.has(category)) return false;
  return true;
}

export function isSalaryCategory(category: string): boolean {
  return category === SALARY_CATEGORY;
}

export function normalizeItemName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
