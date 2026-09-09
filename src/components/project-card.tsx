"use client";

import Link from "next/link";
import type { Project } from "@/lib/projects";
import { useLang } from "@/components/language-provider";
import { t, type TranslationKey } from "@/lib/i18n";
import { ArrowUpRight } from "lucide-react";

const statusKey: Record<Project["status"], TranslationKey> = {
  active: "tagActive",
  wip: "tagWIP",
  maintained: "tagMaintained",
  archived: "tagArchive",
};

export default function ProjectCard({ project }: { project: Project }) {
  const { lang } = useLang();

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex min-h-52 flex-col border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/55 hover:bg-[var(--color-accent-glow)] hover:shadow-[0_18px_50px_-30px_var(--color-accent)] sm:p-7"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="rounded-full bg-[var(--color-accent-glow)] px-3 py-1 text-xs font-mono text-[var(--color-accent)]">
          {project.category || "Code"}
        </span>
        <span className="text-xs text-[var(--color-fg-muted)]">
          {t(statusKey[project.status], lang)}
        </span>
      </div>

      <h3 className="mb-3 text-xl font-bold leading-snug tracking-tight text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)]">
        {project.title}
      </h3>
      <p className="line-clamp-3 flex-1 text-sm leading-7 text-[var(--color-fg-dim)]">
        {project.description || (lang === "zh" ? "进入项目查看详细介绍。" : "Open the project for details.")}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)]/70 pt-4">
        <div className="flex min-w-0 gap-2 overflow-hidden">
          {project.techs.slice(0, 3).map((tech) => (
            <span key={tech} className="shrink-0 text-[11px] font-mono text-[var(--color-fg-muted)]">
              #{tech}
            </span>
          ))}
        </div>
        <span className="ml-4 inline-flex shrink-0 items-center gap-1 text-xs font-mono text-[var(--color-accent)]">
          {lang === "zh" ? "查看项目" : "View project"}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
