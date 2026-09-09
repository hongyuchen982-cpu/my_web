"use client";

import type { Post } from "@/lib/posts";
import MDXContent from "@/components/mdx-content";
import { useLang } from "@/components/language-provider";
import { formatDate, t } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, Clock, User } from "lucide-react";

export default function PostDetailContent({ post }: { post: Post }) {
  const { lang } = useLang();
  const date = formatDate(post.date, lang, "long");
  const readTime = post.readTime;

  return (
    <article className="mx-auto max-w-4xl">
      <Link
        href="/posts"
        className="mb-10 inline-flex items-center gap-2 text-sm font-mono text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
      >
        <ArrowLeft className="w-3 h-3" />
        {t("backToBlog", lang)}
      </Link>

      <header className="mb-10">
        <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-[var(--color-fg)] md:text-5xl">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {date && (
            <time className="text-[var(--color-fg-muted)] font-mono tabular-nums">
              {date}
            </time>
          )}
          {post.author && (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-accent)]/80 font-mono">
              <User className="w-3 h-3" />
              {post.author.name}
            </span>
          )}
          <span className="rounded-full border border-[var(--color-accent)]/35 px-2 py-0.5 text-[10px] font-mono tracking-wider text-[var(--color-accent)]">
            {lang === "zh" ? "原创" : "Original"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--color-fg-muted)] font-mono">
            <Clock className="w-3 h-3" />
            {readTime}
          </span>
        </div>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXContent content={post.content} />
      </div>
    </article>
  );
}
