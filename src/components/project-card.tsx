"use client";

import type { Project } from "@/lib/projects";
import { useLang } from "@/components/language-provider";
import { t, type TranslationKey } from "@/lib/i18n";
import { ExternalLink } from "lucide-react";

const statusColors: Record<Project["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  wip: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  maintained: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  archived: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
};

const statusKey: Record<Project["status"], TranslationKey> = {
  active: "tagActive",
  wip: "tagWIP",
  maintained: "tagMaintained",
  archived: "tagArchive",
};

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

export default function ProjectCard({ project }: { project: Project }) {
  const { lang } = useLang();

  return (
    <div className={`card-glow border ${border} rounded-xl p-5 ${surface} flex flex-col`}>
      {/* Tags */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="tag bg-[var(--color-accent-glow)] text-[var(--color-accent)] border border-[var(--color-accent)]/30">
          [{project.category}]
        </span>
        <span className={`tag border ${statusColors[project.status]}`}>
          {t(statusKey[project.status], lang)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-2 leading-snug">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-[var(--color-fg-dim)] leading-relaxed mb-4 flex-1">
        {project.description}
      </p>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {project.techs.map((tech) => (
          <span
            key={tech}
            className="text-[10px] font-mono text-[var(--color-fg-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-1.5 py-0.5"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className={`flex items-center gap-3 pt-3 border-t ${border}`}>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            Demo
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 font-mono"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Source
          </a>
        )}
      </div>
    </div>
  );
}
