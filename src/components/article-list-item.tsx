"use client";

import Link from "next/link";
import type { Post } from "@/lib/posts";
import { useLang } from "@/components/language-provider";
import { formatDate } from "@/lib/i18n";

const border = "border-[var(--color-border)]";

export default function ArticleListItem({ post }: { post: Post }) {
  const { lang } = useLang();
  const date = formatDate(post.date, lang);
  const readTime = post.readTime;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`group -mx-3 flex flex-col gap-2 rounded border-b px-3 py-6 transition-colors last:border-b-0 hover:bg-[var(--color-surface-hover)] sm:flex-row sm:items-start sm:gap-8 ${border}`}
    >
      <div className="flex shrink-0 items-center gap-3 pt-1 sm:w-36">
        <time className="text-sm text-[var(--color-fg-muted)] font-mono tabular-nums">
          {date}
        </time>
        <span className="text-[10px] text-[var(--color-fg-muted)]/60 font-mono hidden sm:inline">
          {readTime}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="inline text-lg font-semibold text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)] link-underline">
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {post.author && (
            <span className="text-[11px] text-[var(--color-accent)]/70 font-mono">
              @{post.author.name}
            </span>
          )}
          <span className="text-[10px] text-[var(--color-fg-muted)]/60 font-mono sm:hidden">
            {readTime}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-[var(--color-fg-dim)]">
          {post.excerpt}
        </p>
      </div>
      <span className="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors text-sm pt-0.5 shrink-0 opacity-0 group-hover:opacity-100 hidden sm:block">
        →
      </span>
    </Link>
  );
}
