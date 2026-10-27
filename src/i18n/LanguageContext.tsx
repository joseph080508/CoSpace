"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";
import type { Language } from "@/i18n";
import { getTranslation } from "@/i18n";
import { getStoredLanguage, saveLanguage } from "@/i18n/storage";

function subscribeLanguage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener("cospace-language-change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("cospace-language-change", callback); };
}

function getServerLanguage(): Language { return "es"; }

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }): ReactNode {
  const language = useSyncExternalStore(subscribeLanguage, getStoredLanguage, getServerLanguage);
  const updateLanguage = useCallback((value: Language) => { saveLanguage(value); window.dispatchEvent(new Event("cospace-language-change")); }, []);

  const t = useCallback((key: string): string => getTranslation(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
