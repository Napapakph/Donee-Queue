'use client';
import { useAppStore } from '@/lib/store';
import { translations, TranslationKey } from '@/lib/translations';

export function useTranslation() {
  const language = useAppStore((s) => s.settings.language) || 'en';
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return { t, language };
}
