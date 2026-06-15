"use client";

import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import DeleteBtn from "@/components/delete-btn";
import type { Project } from "@/lib/projects";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

const statusKey: Record<string, keyof typeof import("@/lib/i18n").translations> = {
  active: "active",
  wip: "wip",
  maintained: "maintained",
  archived: "archived",
};

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30",
  wip: "bg-amber-500/10 text-amber-500 border border-amber-500/30",
  maintained: "bg-blue-500/10 text-blue-500 border border-blue-500/30",
  archived: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/30",
};

interface ProjectsManagementProps {
  projects: Project[];
  deleteAction: (formData: FormData) => void;
}

export default function ProjectsManagement({
  projects,
  deleteAction,
}: ProjectsManagementProps) {
  const { lang } = useLang();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
            {t("manageProjectsTitle", lang)}
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] font-mono mt-1">
            {projects.length} {t("adminProjects", lang)}
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 text-xs font-mono text-white bg-[var(--color-accent)] hover:opacity-90 transition-all rounded-lg px-4 py-2"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("newProject", lang)}
        </Link>
      </div>

      {projects.length === 0 ? (
        <div
          className={`border border-dashed ${border} rounded-xl p-12 text-center`}
        >
          <p className="text-xs text-[var(--color-fg-muted)] font-mono">
            {t("noProjectsYet", lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`border ${border} rounded-xl p-4 ${surface} hover:border-[var(--color-accent)]/20 transition-all`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-[var(--color-fg)]">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[var(--color-fg-dim)] mt-1 line-clamp-1 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-fg-muted)]"
                    >
                      {project.category || t("uncategorized", lang)}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        statusColor[project.status] || statusColor.active
                      }`}
                    >
                      {t((statusKey[project.status] || "active") as keyof typeof import("@/lib/i18n").translations, lang)}
                    </span>
                    {project.techs.length > 0 && (
                      <span className="text-[10px] font-mono text-[var(--color-fg-muted)]">
                        {project.techs.join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors rounded"
                      title="Visit"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors rounded"
                    title={t("edit", lang)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                  <DeleteBtn
                    id={project.id}
                    label={project.title}
                    action={deleteAction}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/admin"
        className="inline-block text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors font-mono"
      >
        {t("backToDashboard", lang)}
      </Link>
    </div>
  );
}
