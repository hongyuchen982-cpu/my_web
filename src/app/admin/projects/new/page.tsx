"use client";

import { useActionState } from "react";
import { createProject } from "@/app/actions/projects";
import ProjectEditor from "@/components/project-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import type { ProjectActionResult } from "@/app/actions/projects";

export default function NewProjectPage() {
  const { lang } = useLang();
  const [state, action, pending] = useActionState(createProject, {
    success: false,
  } as ProjectActionResult);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("backToProjects", lang)}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
          {t("createProject", lang)}
        </h1>
      </div>

      {state?.message && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3">
          <p className="text-xs text-red-500 font-mono">{state.message}</p>
        </div>
      )}

      <form action={action} className="space-y-6">
        <ProjectEditor
          submitLabel={pending ? t("saving", lang) : t("createBtn", lang)}
        />

        {state?.errors && (
          <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3 space-y-1">
            {Object.entries(state.errors).map(([field, msgs]) => (
              <p key={field} className="text-xs text-red-500 font-mono">
                {field}: {msgs.join(", ")}
              </p>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
