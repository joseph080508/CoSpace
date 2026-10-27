"use client";

import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function LanguageSelector(): React.JSX.Element {
  const { language, setLanguage } = useLanguage();

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as "es" | "en")}
      className="language-selector"
    >
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  );
}
