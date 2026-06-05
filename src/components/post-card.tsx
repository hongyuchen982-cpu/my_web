"use client";

import Link from "next/link";
import type { Post } from "@/lib/posts";
import { useLang } from "@/components/language-provider";
import { formatDate } from "@/lib/i18n";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

export default function PostCard({ post }: { post: Post }) {
  const { lang } = useLang();
  const date = formatDate(post.date, lang);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`card-glow block border ${border} rounded-xl p-5 ${surface}`}
    >
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-1">
        {post.title}
      </h2>
      {date && (
        <time className="text-xs text-[var(--color-fg-muted)] font-mono mb-2 block">
          {date}
        </time>
      )}
      <p className="text-sm text-[var(--color-fg-dim)] leading-relaxed line-clamp-2">
        {post.excerpt}
      </p>
    </Link>
  );
}
