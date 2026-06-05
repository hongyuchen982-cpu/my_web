"use client";

import Link from "next/link";
import type { Post } from "@/lib/posts";
import { useLang } from "@/components/language-provider";
import { formatDate } from "@/lib/i18n";

const border = "border-[var(--color-border)]";

export default function ArticleListItem({ post }: { post: Post }) {
  const { lang } = useLang();
  const date = formatDate(post.date, lang);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`group flex items-start gap-6 py-3 border-b ${border} last:border-b-0 hover:bg-[var(--color-surface-hover)] transition-colors -mx-2 px-2 rounded`}
    >
      <time className="text-xs text-[var(--color-fg-muted)] font-mono pt-0.5 shrink-0 w-24 tabular-nums">
        {date}
      </time>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors link-underline inline">
          {post.title}
        </h3>
        <p className="text-xs text-[var(--color-fg-dim)] mt-1 line-clamp-1 leading-relaxed">
          {post.excerpt}
        </p>
      </div>
      <span className="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors text-sm pt-0.5 shrink-0 opacity-0 group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}
