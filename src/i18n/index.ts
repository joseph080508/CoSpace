export type Language = "es" | "en";

import { translationsEs } from "./translations.es";
import { translationsEn } from "./translations.en";

export const translations: Record<Language, Record<string, string>> = {
  es: translationsEs,
  en: translationsEn,
};

export function getTranslation(language: Language, key: string): string {
  return translations[language][key] ?? key;
}