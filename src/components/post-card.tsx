"use client";

import Link from "next/link";
import type { Post } from "@/lib/posts";
import { useLang } from "@/components/language-provider";
import { formatDate } from "@/lib/i18n";

/** Deterministic geometric SVG based on post slug + title. */
function GeometricIcon({ seed }: { seed: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xfffffff;
  }
  const patterns = ["circles", "triangles", "squares", "dots", "waves"];
  const pattern = patterns[hash % patterns.length];

  const hue = hash % 360;
  const c1 = `hsl(${hue}, 20%, 80%)`;
  const c2 = `hsl(${hue}, 15%, 90%)`;

  switch (pattern) {
    case "circles":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="30" cy="30" r="20" fill={c1} />
          <circle cx="65" cy="40" r="14" fill="none" stroke={c1} strokeWidth="2" />
          <circle cx="50" cy="72" r="10" fill={c1} opacity="0.5" />
        </svg>
      );
    case "triangles":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 82,62 18,62" fill="none" stroke={c1} strokeWidth="2" />
          <polygon points="50,42 66,72 34,72" fill={c1} opacity="0.5" />
        </svg>
      );
    case "squares":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="18" y="20" width="28" height="28" fill="none" stroke={c1} strokeWidth="2" rx="4" />
          <rect x="54" y="36" width="22" height="22" fill={c1} opacity="0.5" rx="3" />
          <rect x="30" y="60" width="18" height="18" fill={c2} stroke={c1} strokeWidth="1.5" rx="2" />
        </svg>
      );
    case "dots":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {[20, 50, 80, 30, 60, 45].map((cx, i) => (
            <circle key={i} cx={cx} cy={20 + i * 14} r={4 + (i % 4)} fill={c1} opacity={0.4 + i * 0.1} />
          ))}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M0 25 Q25 10 50 25 Q75 40 100 25" fill="none" stroke={c1} strokeWidth="2.5" />
          <path d="M0 50 Q25 35 50 50 Q75 65 100 50" fill="none" stroke={c1} strokeWidth="1.5" opacity="0.5" />
          <path d="M0 75 Q25 60 50 75 Q75 90 100 75" fill="none" stroke={c1} strokeWidth="1" opacity="0.25" />
        </svg>
      );
  }
}

export default function PostCard({ post }: { post: Post }) {
  const { lang } = useLang();
  const date = formatDate(post.date, lang);
  const readTime = post.readTime;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="card-glow group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:bg-[var(--color-surface-hover)]"
    >
      {/* Row 1: Category + Original label + Date */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-accent)]">
            {post.category || (lang === "zh" ? "未分类" : "Uncategorized")}
          </span>
          <span className="rounded-full border border-[var(--color-accent)]/30 px-2 py-0.5 text-[9px] font-mono tracking-wider text-[var(--color-accent)]">
            {lang === "zh" ? "原创" : "Original"}
          </span>
        </div>
        <time className="text-xs font-mono tabular-nums text-[var(--color-fg-muted)]">
          {date}
        </time>
      </div>

      {/* Row 2: Geometric icon */}
      <div className="mb-5 aspect-[2/1] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
        <GeometricIcon seed={post.slug + post.title} />
      </div>

      {/* Row 3: Title */}
      <h3 className="mb-3 text-xl font-bold leading-snug tracking-tight text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)]">
        {post.title}
      </h3>

      {/* Row 4: Excerpt */}
      <p className="mb-6 line-clamp-3 flex-1 text-sm leading-7 text-[var(--color-fg-dim)]">
        {post.excerpt}
      </p>

      {/* Row 5: Author */}
      <div className="flex items-center gap-2.5 border-t border-[var(--color-border)] pt-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-glow)] text-[10px] font-mono text-[var(--color-accent)]">
          {post.author?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-xs font-mono text-[var(--color-fg-dim)]">
            {post.author?.name || (lang === "zh" ? "站点作者" : "Site author")}
          </span>
          <span className="shrink-0 text-[10px] font-mono text-[var(--color-fg-muted)]">
            {readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
