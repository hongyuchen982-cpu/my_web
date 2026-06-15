"use client";

import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { useLang } from "@/components/language-provider";
import { t, formatDate } from "@/lib/i18n";
import DeleteBtn from "@/components/delete-btn";
import type { Post } from "@/lib/posts";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

interface PostsManagementProps {
  posts: Post[];
  deleteAction: (formData: FormData) => void;
}

export default function PostsManagement({
  posts,
  deleteAction,
}: PostsManagementProps) {
  const { lang } = useLang();

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
            {t("managePostsTitle", lang)}
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] font-mono mt-1">
            {posts.length} {t("adminPosts", lang)}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 text-xs font-mono text-white bg-[var(--color-accent)] hover:opacity-90 transition-all rounded-lg px-4 py-2"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("newPost", lang)}
        </Link>
      </div>

      {posts.length === 0 ? (
        <div
          className={`border border-dashed ${border} rounded-xl p-12 text-center`}
        >
          <p className="text-xs text-[var(--color-fg-muted)] font-mono">
            {t("noPostsYet", lang)}
          </p>
        </div>
      ) : (
        <div className={`border ${border} rounded-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${border} ${surface}`}>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-[var(--color-fg-muted)] uppercase tracking-wider font-medium">
                    {t("title", lang)}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-[var(--color-fg-muted)] uppercase tracking-wider font-medium hidden md:table-cell">
                    {t("status", lang)}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-[var(--color-fg-muted)] uppercase tracking-wider font-medium hidden md:table-cell">
                    {t("date", lang)}
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-mono text-[var(--color-fg-muted)] uppercase tracking-wider font-medium">
                    {t("actions", lang)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className={`border-b ${border} last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--color-fg)]">
                        {post.title}
                      </div>
                      <div className="text-[10px] text-[var(--color-fg-muted)] font-mono mt-0.5">
                        /posts/{post.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          post.published
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                        }`}
                      >
                        {post.published ? t("published", lang) : t("draft", lang)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-[var(--color-fg-muted)] font-mono tabular-nums">
                        {formatDate(post.date, lang, "short")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors rounded"
                          title={t("edit", lang)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <DeleteBtn
                          id={post.id}
                          label={post.title}
                          action={deleteAction}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Link
        href="/admin"
        className="inline-block text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors font-mono"
      >
        {t("backToDashboard", lang)}
      </Link>
    </>
  );
}
