"use client";

import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

const EMAILS = ["hongyuchen982@gmail.com", "1114857160@qq.com"] as const;

interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="stat-number">
      {display}
      {suffix}
    </span>
  );
}

export default function HeroSection({
  projectCount,
  postCount,
  techCount,
}: {
  projectCount: number;
  postCount: number;
  techCount: number;
}) {
  const { lang } = useLang();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      window.setTimeout(() => setCopiedEmail(null), 1600);
    } catch {
      window.prompt(lang === "zh" ? "复制邮箱" : "Copy email", email);
    }
  }

  const stats: Stat[] = [
    { label: t("statsProjects", lang), value: projectCount },
    { label: t("statsPosts", lang), value: postCount },
    { label: t("statsTechs", lang), value: techCount, suffix: "+" },
  ];

  return (
    <section className="relative py-16 md:py-24 hero-gradient">
      <div className="max-w-3xl">
        <p className="mb-7 inline-flex items-center rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent-glow)] px-4 py-2 text-sm font-mono text-[var(--color-accent)]">
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          {lang === "zh" ? "欢迎技术交流" : "Welcome to my lab"}
        </p>
        <h1 className="text-5xl font-bold leading-[1.08] tracking-[-0.04em] text-[var(--color-fg)] md:text-7xl">
          {lang === "zh" ? (
            <>但积跬步，<br /><span className="text-[var(--color-accent)] glow-text">莫问前程</span></>
          ) : (
            <>Build step by step.<br /><span className="text-[var(--color-accent)] glow-text">Keep moving forward.</span></>
          )}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--color-fg-dim)] md:text-xl md:leading-9">
          {t("heroSubtitle", lang)}
        </p>

        <div
          id="contact"
          className="scroll-mt-24 mt-8 flex flex-col items-start gap-2 sm:flex-row sm:items-center"
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-fg-muted)] sm:mr-1">
            <Mail className="w-3.5 h-3.5" />
            {lang === "zh" ? "联系我" : "Contact"}
          </span>
          {EMAILS.map((email) => (
            <button
              key={email}
              type="button"
              onClick={() => copyEmail(email)}
              className="group inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-mono text-[var(--color-fg-dim)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]"
              title={lang === "zh" ? "点击复制邮箱" : "Click to copy email"}
            >
              {email}
              {copiedEmail === email ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid max-w-xl grid-cols-3 gap-3 md:mt-16 md:gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
            <div className="text-2xl md:text-3xl font-bold text-[var(--color-accent)] font-mono tracking-tight">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="mt-2 text-[11px] font-mono text-[var(--color-fg-muted)] md:text-xs">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
