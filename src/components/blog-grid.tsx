"use client";

import { useState, useMemo } from "react";
import type { Post } from "@/lib/posts";
import PostCard from "@/components/post-card";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { Search } from "lucide-react";

export default function BlogGrid({ posts }: { posts: Post[] }) {
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Derive unique categories from posts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    posts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ["All", ...Array.from(cats)];
  }, [posts]);

  // Filter & search
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return posts.filter((p) => {
      // Category filter
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      // Search query
      if (q) {
        const inTitle = p.title.toLowerCase().includes(q);
        const inExcerpt = p.excerpt.toLowerCase().includes(q);
        if (!inTitle && !inExcerpt) return false;
      }
      return true;
    });
  }, [posts, query, activeCategory]);

  return (
    <div className="w-full">
      {/* ── Top Utility Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        {/* Category tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 text-xs font-mono transition-colors border border-transparent ${
                activeCategory === cat
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-200 dark:hover:border-gray-700"
              }`}
            >
              {cat === "All" ? (lang === "zh" ? "全部" : "All") : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "zh" ? "搜索文章…" : "Search posts…"}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-transparent border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">
            {query
              ? lang === "zh"
                ? `没有找到匹配 "${query}" 的文章`
                : `No posts matching "${query}"`
              : t("noPosts", lang)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-gray-200 dark:border-gray-800">
          {filtered.map((post) => (
            <div
              key={post.slug}
              className="border-r border-b border-gray-200 dark:border-gray-800"
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-6 text-center">
        {filtered.length}{" "}
        {lang === "zh"
          ? activeCategory === "All"
            ? "篇文章"
            : `${activeCategory} · ${filtered.length} 篇`
          : activeCategory === "All"
            ? "posts"
            : `posts in ${activeCategory}`}
      </p>
    </div>
  );
}
