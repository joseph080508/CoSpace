import type { Language } from "@/i18n";

const LANGUAGE_KEY = "cospace-language";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === "es" || stored === "en") return stored;
  return "es";
}

export function saveLanguage(language: Language): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_KEY, language);
}