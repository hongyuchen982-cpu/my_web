"use client";

import { useActionState } from "react";
import { updateProject } from "@/app/actions/projects";
import ProjectEditor from "@/components/project-editor";
import Link from "next/link";
import FormErrors from "@/components/form-errors";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/lib/validations";

interface EditProjectFormProps {
  initialData: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    url: string;
    github: string;
    techs: string;
    sortOrder: number;
  };
}

export default function EditProjectForm({ initialData }: EditProjectFormProps) {
  const { lang } = useLang();
  const [state, action, pending] = useActionState(updateProject, {
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
          {t("editProject", lang)}
        </h1>
      </div>

      <FormErrors message={state?.message} errors={state?.errors} />

      <form action={action} className="space-y-6">
        <input type="hidden" name="id" value={initialData.id} />
        <ProjectEditor
          initialTitle={initialData.title}
          initialDescription={initialData.description}
          initialCategory={initialData.category}
          initialStatus={initialData.status}
          initialUrl={initialData.url}
          initialGithub={initialData.github}
          initialTechs={initialData.techs}
          initialSortOrder={initialData.sortOrder}
          submitLabel={pending ? t("saving", lang) : t("updateBtn", lang)}
        />
      </form>
    </div>
  );
}
