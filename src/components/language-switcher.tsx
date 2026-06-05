"use client";

import { useLang } from "@/components/language-provider";

const border = "border-[var(--color-border)]";

export default function LanguageSwitcher() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      className={`text-[10px] font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors border ${border} rounded px-1.5 py-0.5 hover:border-[var(--color-accent)]/30`}
      title={lang === "zh" ? "Switch to English" : "切换到中文"}
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
