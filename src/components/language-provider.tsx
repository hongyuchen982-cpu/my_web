"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";

const LANGUAGE_EVENT = "chy-language-change";

function getLanguageSnapshot(): Lang {
  const stored = localStorage.getItem("lang");
  return stored === "en" ? "en" : "zh";
}

function getServerLanguageSnapshot(): Lang {
  return "zh";
}

function subscribeToLanguage(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LANGUAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANGUAGE_EVENT, onStoreChange);
  };
}

const LanguageContext = createContext<{
  lang: Lang;
  toggleLang: () => void;
}>({ lang: "zh", toggleLang: () => {} });

export function useLang() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );

  const toggleLang = useCallback(() => {
    const next = lang === "zh" ? "en" : "zh";
    localStorage.setItem("lang", next);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
