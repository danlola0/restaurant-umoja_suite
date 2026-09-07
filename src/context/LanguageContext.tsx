import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AppLocale,
  LOCALE_STORAGE_KEY,
  TranslationKey,
  translations,
  translateCategoryName,
  translateDishDescription as translateDishDescriptionName,
  translateDishName,
} from '../i18n/clientTranslations';

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey) => string;
  translateCategory: (name: string) => string;
  translateDish: (name: string) => string;
  translateDishDescription: (name: string, description?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'zh') return stored;
  } catch {
    /* ignore */
  }
  return 'fr';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<AppLocale>(readStoredLocale);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale]);
  const translateCategory = useCallback((name: string) => translateCategoryName(name, locale), [locale]);
  const translateDish = useCallback((name: string) => translateDishName(name, locale), [locale]);
  const translateDishDescription = useCallback(
    (name: string, description = '') => translateDishDescriptionName(name, description, locale),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, translateCategory, translateDish, translateDishDescription }),
    [locale, setLocale, t, translateCategory, translateDish, translateDishDescription]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
