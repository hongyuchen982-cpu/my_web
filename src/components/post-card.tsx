"use client";

import Link from "next/link";
import type { Post } from "@/lib/posts";
import { useLang } from "@/components/language-provider";
import { formatDate } from "@/lib/i18n";
import { estimateReadTime } from "@/lib/read-time";

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
  const readTime = estimateReadTime(post.content);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block border border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors p-6 flex flex-col h-full"
    >
      {/* Row 1: Category + Date */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {post.category || (lang === "zh" ? "未分类" : "Uncategorized")}
        </span>
        <time className="text-[10px] font-mono tabular-nums text-gray-400 dark:text-gray-500">
          {date}
        </time>
      </div>

      {/* Row 2: Geometric icon */}
      <div className="aspect-[16/9] mb-5 overflow-hidden bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/50">
        <GeometricIcon seed={post.slug + post.title} />
      </div>

      {/* Row 3: Title */}
      <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mb-2 leading-snug">
        {post.title}
      </h3>

      {/* Row 4: Excerpt */}
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-5 flex-1">
        {post.excerpt}
      </p>

      {/* Row 5: Author */}
      <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800/50">
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-mono text-gray-500 dark:text-gray-400 shrink-0">
          {post.author?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
            {post.author?.name || "Anonymous"}
          </span>
          <span className="text-[10px] text-gray-300 dark:text-gray-600 font-mono shrink-0">
            {readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
