import React from 'react';
import { AppLocale } from '../../i18n/clientTranslations';
import { useI18n } from '../../context/LanguageContext';

const OPTIONS: { id: AppLocale; code: string; flag: string; label: string }[] = [
  { id: 'fr', code: 'FR', flag: '🇫🇷', label: 'Français' },
  { id: 'en', code: 'EN', flag: '🇬🇧', label: 'English' },
  { id: 'zh', code: 'ZH', flag: '🇨🇳', label: '中文' },
];

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('language')}
      className="flex items-center gap-0.5 rounded-xl border border-amber-500/25 bg-stone-950/70 p-0.5 shadow-inner backdrop-blur-md"
    >
      {OPTIONS.map(option => {
        const active = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            title={option.label}
            onClick={() => setLocale(option.id)}
            className={`flex min-h-8 items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-extrabold tracking-wide transition sm:px-2 ${
              active
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <span aria-hidden="true">{option.flag}</span>
            <span>{option.code}</span>
          </button>
        );
      })}
    </div>
  );
};
