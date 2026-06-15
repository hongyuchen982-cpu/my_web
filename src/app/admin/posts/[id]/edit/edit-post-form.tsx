"use client";

import { useActionState } from "react";
import { updatePost } from "@/app/actions/posts";
import PostEditor from "@/components/post-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import type { PostActionResult } from "@/app/actions/posts";

interface EditPostFormProps {
  initialData: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    published: boolean;
  };
}

export default function EditPostForm({ initialData }: EditPostFormProps) {
  const { lang } = useLang();
  const [state, action, pending] = useActionState(updatePost, {
    success: false,
  } as PostActionResult);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("backToPosts", lang)}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
          {t("editPost", lang)}
        </h1>
      </div>

      {state?.message && (
        <div className="border border-red-500/30 bg-red-500/5 rounded-lg px-4 py-3">
          <p className="text-xs text-red-500 font-mono">{state.message}</p>
        </div>
      )}

      <form action={action} className="space-y-6">
        <input type="hidden" name="id" value={initialData.id} />
        <PostEditor
          initialTitle={initialData.title}
          initialSlug={initialData.slug}
          initialExcerpt={initialData.excerpt}
          initialContent={initialData.content}
          initialCategory={initialData.category}
          initialPublished={initialData.published}
          submitLabel={pending ? t("saving", lang) : t("updateBtn", lang)}
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
