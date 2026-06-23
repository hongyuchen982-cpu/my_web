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
      className={`group flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 py-4 border-b ${border} last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors -mx-2 px-2 rounded`}
    >
      <div className="flex items-center gap-3 sm:w-28 shrink-0 pt-0.5">
        <time className="text-xs text-[var(--color-fg-muted)] font-mono tabular-nums">
          {date}
        </time>
        <span className="text-[10px] text-[var(--color-fg-muted)]/60 font-mono hidden sm:inline">
          {readTime}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors link-underline inline">
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
        <p className="text-xs text-[var(--color-fg-dim)] mt-1 line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
      </div>
      <span className="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors text-sm pt-0.5 shrink-0 opacity-0 group-hover:opacity-100 hidden sm:block">
        →
      </span>
    </Link>
  );
}
