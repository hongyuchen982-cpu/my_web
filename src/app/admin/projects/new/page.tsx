"use client";

import { useActionState } from "react";
import { createProject } from "@/app/actions/projects";
import ProjectEditor from "@/components/project-editor";
import Link from "next/link";
import FormErrors from "@/components/form-errors";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/lib/validations";

export default function NewProjectPage() {
  const { lang } = useLang();
  const [state, action, pending] = useActionState(createProject, {
    success: false,
  } as ActionResult);

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

      <FormErrors message={state?.message} errors={state?.errors} />

      <form action={action} className="space-y-6">
        <ProjectEditor
          submitLabel={pending ? t("saving", lang) : t("createBtn", lang)}
        />
      </form>
    </div>
  );
}
