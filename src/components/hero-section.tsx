"use client";

import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";

interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(value);

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
    prevValue.current = value;
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

  const stats: Stat[] = [
    { label: t("statsProjects", lang), value: projectCount },
    { label: t("statsPosts", lang), value: postCount },
    { label: t("statsTechs", lang), value: techCount, suffix: "+" },
  ];

  return (
    <section className="relative py-16 md:py-24 hero-gradient">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-fg)] mb-4 tracking-tight glow-text">
          {t("heroTitle", lang)}
        </h1>
        <p className="text-sm md:text-base text-[var(--color-fg-dim)] max-w-lg mx-auto leading-relaxed font-light">
          {t("heroSubtitle", lang)}
        </p>
      </div>

      <div className="flex items-center justify-center gap-8 md:gap-16">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-[var(--color-accent)] font-mono tracking-tight">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-[11px] md:text-xs text-[var(--color-fg-muted)] font-mono mt-1 tracking-wider uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
