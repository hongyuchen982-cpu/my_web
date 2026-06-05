"use client";

import type { Post } from "@/lib/posts";
import MDXContent from "@/components/mdx-content";
import { useLang } from "@/components/language-provider";
import { formatDate, t } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PostDetailContent({ post }: { post: Post }) {
  const { lang } = useLang();
  const date = formatDate(post.date, lang, "long");

  return (
    <article className="max-w-2xl mx-auto">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft className="w-3 h-3" />
        {t("backToBlog", lang)}
      </Link>

      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-fg)] mb-3 leading-snug tracking-tight">
          {post.title}
        </h1>
        {date && (
          <time className="text-sm text-[var(--color-fg-muted)] font-mono">
            {date}
          </time>
        )}
      </header>

      <MDXContent content={post.content} />
    </article>
  );
}
