import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { I18nContext, type I18nContextValue } from './context';
import { translations, type Language } from './translations';

const STORAGE_KEY = 'mdaryger_admin_language';

function getNestedTranslation(language: Language, key: string): string | null {
  const parts = key.split('.');
  let current: unknown = translations[language];

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : null;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    return stored === 'ky' ? 'ky' : 'ru';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, params) => {
      const localized = getNestedTranslation(language, key) ?? getNestedTranslation('ru', key) ?? key;

      return interpolate(localized, params);
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
